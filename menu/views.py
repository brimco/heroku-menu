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

from .models import User, Tag, Category, Food, Ingredient, Recipe, MealPlan

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
        
        print('start')
        plan = json.dumps({
                'id': plans[indx].id,
                'date': plan_date,
                'recipes': [{'name': r.name, 'id': r.id} for r in plans[indx].recipes.all()],
                'notes': plans[indx].notes
            })
        print(f'stop. plan: {plan}')
    else: 
        plan = None

    # grocery categories    
    grocery_categories = {}
    for item in Food.objects.filter(user=request.user, on_grocery_list=True).order_by('category__name'):
        category_name = 'Other'
        if item.category:
            category_name = item.category.name

        if category_name not in grocery_categories:
            grocery_categories[category_name] = 0
        grocery_categories[category_name] += 1

    # random recipe
    all_recipes = Recipe.objects.filter(user=request.user).all()
    random_recipe = None
    if len(all_recipes) > 0:
        random_recipe = get_str_recipes(request.user, id=random.choice(all_recipes).id)

    return render(request, 'menu/index.html', {
        'random_recipe': random_recipe,
        'upcoming_meal_plan': plan,
        'grocery_categories': json.dumps(grocery_categories)
    })

@login_required
def recipes(request):
    search_recipes = request.GET.get('recipe', '')
    search_tags = request.GET.get('tag', '')
    return render(request, 'menu/all_recipes.html', {
        'recipes': get_str_recipes(user=request.user),
        'search_recipes': search_recipes,
        'search_tags': search_tags
    })

@csrf_exempt
@login_required
def recipe(request, recipe_id):
    if request.method == 'PUT':
        # delete recipe
        info = json.loads(request.body.decode("utf-8"))
        Recipe.objects.filter(user=request.user, pk=info['id']).delete()
        return JsonResponse({'deleted': True})

    return render(request, 'menu/recipe.html', {
        'recipe': Recipe.objects.get(user=request.user, pk=recipe_id),
        'recipe_str': get_str_recipes(request.user, id=recipe_id)
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
        # save new/edited recipe
        data = json.loads(request.body)

        # prep time, cooktime, servings
        ints = ['preptime', 'cooktime', 'servings']
        for each in ints:
            if data[each] == '':
                data[each] = None
            else:
                try:
                    data[each] = int(data[each])
                except Exception as err:
                    print('error:', err)
                    data[each] = None

        # get recipe if it's an edit (if there is an id given)
        if data['id']:
            new_recipe = Recipe.objects.get(user=request.user, pk=data['id'])
            new_recipe.name = data['name'].rstrip()
            new_recipe.prep_time = data['preptime']
            new_recipe.cook_time = data['cooktime']
            new_recipe.source = data['source'].rstrip()
            new_recipe.servings = data['servings']

        else:
            # save new recipe
            new_recipe = Recipe(
                user = request.user,
                name = data['name'].rstrip(),
                prep_time = data['preptime'],
                cook_time = data['cooktime'],
                source = data['source'].rstrip(),
                servings = data['servings'],
            )
        new_recipe.save()

        # save tag (need to get list of objs)
        tag_objs = []
        for tag in data['tags']:
            tag = tag.rstrip()
            try: 
                tag_obj = Tag.objects.get(user=request.user, name=tag)
            except ObjectDoesNotExist:
                tag_obj = Tag(name=tag, user=request.user)
                tag_obj.save()
            tag_objs.append(tag_obj)
        new_recipe.tags.set(tag_objs)

        # save ingredient objs
        ingredient_objs = []
        for i in data['ingredients']:
            # need to create a new ingredient for every one. see if food is already make
            try: 
                food_obj = Food.objects.get(user=request.user, name__iexact=i['ingredient'].rstrip())
            except ObjectDoesNotExist:
                food_obj = Food.objects.create(name=i['ingredient'].rstrip(), user=request.user)
                food_obj.save()
            
            amt = ''
            if 'amount' in i:
                amt = i['amount']
            
            unt = ''
            if 'unit' in i:
                unt = i['unit']

            dsc = ''
            if 'description' in i:
                dsc = i['description']
            
            new_ingredient = Ingredient(
                user = request.user,
                food = food_obj,
                amount = amt,
                unit = unt, 
                description = dsc
            )
            new_ingredient.save()
            ingredient_objs.append(new_ingredient)
        new_recipe.ingredients.set(ingredient_objs)

        # save steps
        new_recipe.set_steps(data['steps'])
        new_recipe.save()
        return JsonResponse({"id": new_recipe.id})

    return render(request, 'menu/new_recipe.html', {
        'tag_options': json.dumps([t.name for t in Tag.objects.filter(user=request.user).order_by('name')])
    }) 

@csrf_exempt
@login_required
def groceries(request):
    if request.method == 'PUT':
        info = json.loads(request.body.decode("utf-8"))

        obj = Food.objects.get_or_create(user=request.user, name=info['name'], defaults={'name': info['name'], 'user': request.user})[0] 
        was_added = False
        if 'on_grocery_list' in info:
            if obj.on_grocery_list == False:
                was_added = True
            obj.on_grocery_list = info['on_grocery_list']
        
        if 'category' in info:
            category_obj = Category.objects.get_or_create(user=request.user, name__iexact=info['category'], defaults={'name': info['category'], 'user': request.user})[0]
            obj.category = category_obj

        obj.save()

        category = 'Other'
        if obj.category:
            category = obj.category.name

        return JsonResponse({"category": category, "id": obj.id, "was_added": was_added})

    groceries = []
    for category in Category.objects.filter(user=request.user).order_by('name'):
        groceries.append({
            'name': category.name,
            'list': Food.objects.filter(user=request.user, category=category, on_grocery_list=True)
        })
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
            data['notes'] = data['notes'].rstrip()

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
                recipe_obj = Recipe.objects.get(user=request.user, name=recipe)
                recipe_objs.append(recipe_obj)

            meal_plan.recipes.set(recipe_objs)
            return JsonResponse({"id": meal_plan.id})
        except Exception as err:
            return JsonResponse({'error': err})
    return render(request, 'menu/new_meal_plan.html', {
        'all_recipes': Recipe.objects.filter(user=request.user).order_by('name')
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


## tools

def get_str_recipes(user, id=None, as_dict=False):
    if id:
        objs = [Recipe.objects.get(user=user, pk=id)]
    else:
        objs = Recipe.objects.filter(user=user).order_by('name')
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

        recipe_list.append({
            'id': obj.id,
            'name': obj.name,
            'tags': [t.name for t in obj.tags.all()],
            'prep_time': info['prep_time'],
            'cook_time': info['cook_time'],
            'servings': info['servings'],
            'source': obj.source,
            'ingredients': ingredients,
            'steps': obj.steps
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
    objs = Food.objects.filter(user=user, on_grocery_list=True).order_by('category__name')
    lst = {}
    for obj in objs:
        category = 'Other'
        if obj.category:
            category = obj.category.name

        if category not in lst:
            lst[category] = []
        lst[category].append({
            'name': obj.name,
            'category': category
        })
    return json.dumps(lst)
