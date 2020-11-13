from django.shortcuts import render
from django.urls import reverse
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ObjectDoesNotExist
from django.db import IntegrityError
from datetime import date
import json
import random

from .models import User, Tag, Category, Food, Ingredient, Recipe, MealPlan, Feedback

# Create your views here.

@login_required
def index(request):
    if request.user.is_anonymous:
        return HttpResponseRedirect(reverse('menu:login'))

    # plan
    plans = MealPlan.objects.filter(user=request.user).order_by('date')
    indx = 0
    # if there's more than one plan and the latest is atleast today
    if len(plans) > 0 and plans[len(plans) - 1].date >= date.today():
        while (plans[indx].date < date.today()):
            indx += 1        

        plan_date = plans[indx].date
        day = plan_date.strftime('%d').lstrip('0')
        month = plan_date.strftime('%B')
        year = plan_date.strftime('%Y')
        plan_date = f'{month} {day}, {year}'
        
        plan = json.dumps({
                'id': plans[indx].id,
                'date': plan_date,
                'recipes': [{'name': r.name, 'id': r.id} for r in plans[indx].recipes.all()],
                'notes': plans[indx].notes
            })
    else: 
        plan = None

    # grocery categories    
    grocery_categories = {}
    for item in Food.objects.filter(user=request.user, on_grocery_list=True).order_by('category__name'):
        category_name = 'Other'
        if item.category and item.category.name:
            category_name = item.category.name

        if category_name not in grocery_categories:
            grocery_categories[category_name] = 0
        grocery_categories[category_name] += 1

    # random recipe
    all_recipes = Recipe.objects.filter(user=request.user).all()
    random_recipe = None
    if len(all_recipes) > 0:
        random_recipe = get_str_recipes(request.user, id=random.choice(all_recipes).id)

    context = {
        'random_recipe': random_recipe,
        'upcoming_meal_plan': plan,
        'grocery_categories': json.dumps(grocery_categories),
    }

    if request.user.is_superuser:
        # feedback
        feedback = []
        for f in Feedback.objects.filter(resolved=False).order_by('date'):
            feedback.append({
                'user': f.user.username,
                'message': f.text[:25],
                'date': f.date,
                'url': f'/admin/menu/feedback/{f.id}/change/'
            })
        context['feedback'] = feedback

        # users
        users = []
        for user in User.objects.all():
            users.append({
                'name': user.username,
                'last_login': user.last_login,
                'url': f'/admin/menu/user/{user.id}/change/'
            })
        users.sort(key = lambda i: i['last_login'], reverse=True)
        context['users'] = users

        # database info
        database_info = [{
            'name': 'Users',
            'url': '/admin/menu/user',
            'count': User.objects.all().count()
        }, {
            'name': 'Recipes',
            'url': '/admin/menu/recipe',
            'count': Recipe.objects.all().count()
        }, {
            'name': 'Meal Plans',
            'url': '/admin/menu/mealplan',
            'count': MealPlan.objects.all().count()
        }, {
            'name': 'Food',
            'url': '/admin/menu/food',
            'count': Food.objects.all().count()
        }, {
            'name': 'Ingredients',
            'url': '/admin/menu/ingredient',
            'count': Ingredient.objects.all().count()
        }, {
            'name': 'Categories',
            'url': '/admin/menu/category',
            'count': Category.objects.all().count()
        }, {
            'name': 'Tags',
            'url': '/admin/menu/tag',
            'count': Tag.objects.all().count()
        }, {
            'name': 'Feedback',
            'url': '/admin/menu/feedback',
            'count': Feedback.objects.all().count()
        }]
        database_info.sort(key = lambda i: i['name'])
        context['database_info'] = database_info

    return render(request, 'menu/index.html', context)

@login_required
def recipes(request):
    find_name = request.GET.get('recipe', '')
    search_tags = request.GET.get('tag', '')
    return render(request, 'menu/all_recipes.html', {
        'recipes': get_str_recipes(user=request.user),
        'find_name': find_name,
        'search_tags': search_tags
    })

@csrf_exempt
@login_required
def recipe(request, recipe_id):
    if request.method == 'PUT':
        info = json.loads(request.body.decode("utf-8"))

        if info['todo'] == 'delete':
            # delete recipe
            Recipe.objects.filter(user=request.user, pk=info['id']).delete()
            return JsonResponse({'deleted': True})

        elif info['todo'] == 'follow':
            Recipe.objects.get(pk=info['recipe_id']).set_following(info['user'], info['is_following'])
            return JsonResponse({'following': info['is_following']})

    recipe = Recipe.objects.get(pk=recipe_id)
    follows = False
    if request.user in recipe.followed_by.all():
        follows = True

    return render(request, 'menu/recipe.html', {
        'recipe': recipe,
        'recipe_str': get_str_recipes(request.user, id=recipe_id),
        'follows': follows
        })


@login_required
def recipe_groceries(request, recipe_id):
    return render(request, 'menu/recipe_groceries.html', {
        'recipes': json.dumps([get_str_recipes(request.user, id=recipe_id, as_dict=True)])
    })

@login_required
def edit_recipe(request, recipe_id):
    edit = get_str_recipes(request.user, id=recipe_id)
    return render(request, 'menu/new_recipe.html', {
        'tag_options': json.dumps([t.name for t in Tag.objects.filter(user=request.user).order_by('name')]),
        'edit_recipe': json.loads(edit),
        'str_edit_recipe': edit
    })

@csrf_exempt
@login_required
def new_recipe(request, info=None):
    if request.method == 'POST':
        try:
            # save new/edited recipe
            data = json.loads(request.body)

            # clean data
            for each in ['preptime', 'cooktime', 'servings']:
                data[each] = clean_int(data[each])
            for each in ['name', 'source']:
                data[each] = clean_string(data[each])

            # get recipe if it's an edit (if there is an id given)
            if data['id']:
                new_recipe = Recipe.objects.get(user=request.user, pk=data['id'])
                new_recipe.name = data['name']
                new_recipe.prep_time = data['preptime']
                new_recipe.cook_time = data['cooktime']
                new_recipe.source = data['source']
                new_recipe.servings = data['servings']

            else:
                # save new recipe
                new_recipe = Recipe(
                    user = request.user,
                    name = data['name'],
                    prep_time = data['preptime'],
                    cook_time = data['cooktime'],
                    source = data['source'],
                    servings = data['servings'],
                )
            new_recipe.save()

            # save tag (need to get list of objs)
            tag_objs = []
            for tag in data['tags']:
                tag = clean_string(tag)
                try: 
                    tag_obj = Tag.objects.get(user=request.user, name__iexact=tag)
                except ObjectDoesNotExist:
                    tag_obj = Tag(name=tag, user=request.user)
                    tag_obj.save()
                tag_objs.append(tag_obj)
            new_recipe.tags.set(tag_objs)

            # save ingredient objs
            ingredient_objs = []
            for i in data['ingredients']:
                # clean data
                i['ingredient'] = clean_string(i['ingredient'])

                # need to get the food ingredient first
                try: 
                    food_obj = Food.objects.get(user=request.user, name__iexact=i['ingredient'])
                except ObjectDoesNotExist:
                    food_obj = Food.objects.create(name=i['ingredient'], user=request.user)
                    food_obj.save()
                
                amt = ''
                if 'amount' in i:
                    amt = clean_string(i['amount'])
                
                unt = ''
                if 'unit' in i:
                    unt = clean_string(i['unit'])

                dsc = ''
                if 'description' in i:
                    dsc = clean_string(i['description'])

                # next try to find the ingredient if exists (this would happen when editing)
                try:
                    ing_obj = Ingredient.objects.get(user=request.user, recipe=new_recipe, food=food_obj)
                    # set all the other stuff again in case it was updated
                    ing_obj.amount = amt
                    ing_obj.unit = unt
                    ing_obj.description = dsc

                # create new
                except ObjectDoesNotExist:
                    ing_obj = Ingredient.objects.create(
                                    user=request.user, 
                                    recipe=new_recipe, 
                                    food=food_obj,
                                    amount=amt,
                                    unit=unt,
                                    description=dsc)

                ing_obj.save()
                ingredient_objs.append(ing_obj)

            new_recipe.ingredients.set(ingredient_objs) 

            # save steps
            data['steps'] = clean_string(data['steps'])
            new_recipe.set_steps(data['steps'])
            new_recipe.save()
            return JsonResponse({"id": new_recipe.id})
        except Exception as err:
            return JsonResponse({'error': err})

    return render(request, 'menu/new_recipe.html', {
        'tag_options': json.dumps([t.name for t in Tag.objects.filter(user=request.user).order_by('name')])
    }) 

@csrf_exempt
@login_required
def groceries(request):
    if request.method == 'PUT':
        info = json.loads(request.body.decode("utf-8"))
        # clean info
        info['name'] = clean_string(info['name'])

        obj = Food.objects.get_or_create(user=request.user, name__iexact=info['name'], defaults={'name': info['name'], 'user': request.user})[0] 
        was_added = False
        if 'on_grocery_list' in info:
            if obj.on_grocery_list == False:
                was_added = True
            obj.on_grocery_list = info['on_grocery_list']
        
        if 'category' in info:
            info['category'] = clean_string(info['category'])
            category_obj = Category.objects.get_or_create(user=request.user, name__iexact=info['category'], defaults={'name': info['category'], 'user': request.user})[0]
            obj.category = category_obj

        obj.save()

        category = 'Other'
        if obj.category and obj.category.name:
            category = obj.category.name

        return JsonResponse({"category": category, "id": obj.id, "was_added": was_added})

    return render(request, 'menu/groceries.html', {
        'starting_list': get_starting_grocery_list(request.user)
    })


@csrf_exempt
@login_required
def mealplans(request):
    if request.method == 'PUT':
        # delete meal plan
        info = json.loads(request.body.decode("utf-8"))
        if info['id'] == 'all':
            for m in MealPlan.objects.filter(user=request.user).all():
                m.delete()
        else:
            MealPlan.objects.filter(user=request.user, pk=info['id']).delete()

    return render(request, 'menu/mealplans.html', {
        'mealplans': MealPlan.objects.filter(user=request.user).order_by('date')
    })

@csrf_exempt
@login_required
def new_meal_plan(request):
    if request.method == 'POST':
        try:
            # save new/edited meal plan
            data = json.loads(request.body)
            data['notes'] = clean_string(data['notes'])

            # get meal plan if it's an edit (if there is an id given)
            if data['id']:
                meal_plan = MealPlan.objects.get(user=request.user, pk=data['id'])
                meal_plan.set_date(data['date'])
                meal_plan.notes = data['notes']

            else:
                # save new meal plan
                meal_plan = MealPlan(notes = data['notes'], user=request.user)
                meal_plan.set_date(data['date'])
            meal_plan.save()

            # save recipes (need to get list of objs)
            recipe_objs = []
            for recipe in data['recipes']:
                recipe_obj = Recipe.objects.get(name=recipe)
                recipe_objs.append(recipe_obj)

            meal_plan.recipes.set(recipe_objs)
            return JsonResponse({"id": meal_plan.id})
        except Exception as err:
            return JsonResponse({'error': err})
    return render(request, 'menu/new_meal_plan.html', {
        'all_recipes': user_and_followed_recipes(request.user)
    })

@login_required
def recipe_meal_plan(request, recipe_id):
    return render(request, 'menu/new_meal_plan.html', {
        'all_recipes': Recipe.objects.filter(user=request.user).order_by('name'),
        'selected': [Recipe.objects.get(user=request.user, pk=recipe_id)]
    })

@login_required
def focus_meal_plans(request, meal_plan_id):
    return render(request, 'menu/mealplans.html', {
        'mealplans': MealPlan.objects.filter(user=request.user).order_by('date'),
        'focus': meal_plan_id
    })

@login_required
def edit_meal_plan(request, meal_plan_id):
    mealplan = MealPlan.objects.get(pk=meal_plan_id)

    return render(request, 'menu/new_meal_plan.html', {
        'all_recipes': Recipe.objects.filter(user=request.user).order_by('name'),
        'id': mealplan.id,
        'date': mealplan.date,
        'selected': mealplan.recipes.all(),
        'notes': mealplan.notes.rstrip()
    })

@login_required
def meal_plan_groceries(request):
    meal_plans = MealPlan.objects.filter(user=request.user).order_by('date')

    recipes = []
    ids = []
    for plan in meal_plans:
        for recipe in plan.recipes.all():
            if recipe.id not in ids:
                recipes.append(get_str_recipes(request.user, id=recipe.id, as_dict=True))
                ids.append(recipe.id)

    return render(request, 'menu/recipe_groceries.html', {
        'recipes': json.dumps(recipes)
    })


def login_view(request):
    if request.method == "POST":
        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("menu:index"))
        return render(request, "menu/login.html", {
            "message": "Invalid username and/or password."
        })
    return render(request, "menu/login.html")


def logout_view(request):
    logout(request)
    # return HttpResponse('logout page')
    return HttpResponseRedirect(reverse("menu:index"))
    

def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "menu/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "menu/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("menu:index"))
    return render(request, "menu/register.html")

@csrf_exempt
def settings(request):
    if request.method == 'PUT':
        try:
            info = json.loads(request.body.decode("utf-8"))['info']
            if info['todo'] == 'delete':
                category = Category.objects.get(name__iexact=info['category'])
                category.delete()
                return JsonResponse({'success': True})  
            elif info['todo'] == 'add':
                Category.objects.create(user=request.user, name=info['category'])
                return JsonResponse({'success': True})  
            elif info['todo'] == 'reorder':
                try:
                    category = Category.objects.get(name__iexact=info['category'])
                except ObjectDoesNotExist:
                    category = Category.objects.create(name=info['category'], user=request.user, order=info['order'])
                category.order = info['order']
                category.save()
                return JsonResponse({'success': True})  
            elif info['todo'] == 'rename':
                category = Category.objects.get(name__iexact=info['category'])
                category.name = info['edited_name']
                category.save()
                return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    elif request.method == 'POST':
        text = request.POST['text']
        Feedback.objects.create(user=request.user, text=text)
        return render(request, 'menu/settings.html', {'categories': get_categories(request.user), 'message': '✓ Feedback sent. Thank you!', 'show': '#collapseTwo'})

    return render(request, 'menu/settings.html', {'categories': get_categories(request.user)})

## tools

def get_categories(user):
    categories = Category.objects.filter(user=user).order_by('order')
    lst = [str(category) for category in categories]
    if 'Other' not in lst: 
        lst.append('Other')
    return json.dumps(lst)

def get_str_recipes(user, id=None, as_dict=False):
    if id:
        objs = [Recipe.objects.get(pk=id)]
    else:
        objs = Recipe.objects.all()
    recipe_list = []
    for obj in objs:
        ingredients = []
        for i in obj.ingredients.all():
            ingredients.append({
                'id': i.id,
                'food': i.food.name,
                'amount': i.amount,
                'unit': i.unit,
                'description': i.description,
                'string': str(i),
            })

        info = {}
        for each in ['prep_time', 'cook_time', 'servings']:
            info[each] = getattr(obj, each)
            if info[each] == None:
                info[each] = ''
        
        followed = False
        if user in obj.followed_by.all():
            followed = True

        recipe_list.append({
            'id': obj.id,
            'name': obj.name,
            'tags': [t.name for t in obj.tags.all()],
            'prep_time': info['prep_time'],
            'cook_time': info['cook_time'],
            'servings': info['servings'],
            'source': obj.source,
            'ingredients': ingredients,
            'steps': obj.steps,
            'owner': obj.user.username,
            'followed': followed
        })

    recipe_list.sort(key = lambda i: i['name'])

    if id:
        if as_dict:
            return recipe_list[0]
        return json.dumps(recipe_list[0])
    if as_dict:
        return recipe_list
    return json.dumps(recipe_list)

def get_starting_grocery_list(user):
    lst = {}
    # add categories to lst in order
    for category in Category.objects.filter(user=user).order_by('order'):
        lst[category.name] = []

    # add foods to lst
    for food in Food.objects.filter(user=user).order_by('category__order'):
        # get category. default = other
        category = 'Other'
        if food.category and food.category.name:
            category = food.category.name

        # add category if not in list
        if category not in lst:
            lst[category] = []
        
        # add food if on grocery list
        if food.on_grocery_list == True:
            lst[category].append({
                'name': food.name,
                'category': category
            })

    return json.dumps(lst)

def clean_string(input):
    if type(input) == list:
        new_list = []
        for each in input:
            new_list.append(clean_string(each))
        return new_list
    return ''.join(n for n in input if (n.isalnum() or n in '!@#$%^*()-_=+,./?;: ')).rstrip()

def clean_int(input):
    if input == '':
        return None
    try:
        out = int(input)
        return out
    except:
        return None

def user_and_followed_recipes(user):
    recipes = Recipe.objects.all()
    for recipe in recipes:
        if user != recipe.user and user not in recipe.followed_by.all():
            recipes = recipes.exclude(pk=recipe.id)
    return recipes.order_by('name')