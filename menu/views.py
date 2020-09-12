from django.shortcuts import render, reverse
from django.http import HttpResponse, HttpResponseRedirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
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
        'grocery_categories': grocery_categories
    })

def recipes(request):
    return HttpResponse('<h1>recipes<h1>')

def recipe(request):
    return HttpResponse('<h1>recipe<h1>')

def recipe_groceries(request):
    return HttpResponse('<h1>recipe_groceries<h1>')

def edit_recipe(request):
    return HttpResponse('<h1>edit_recipe<h1>')

def new_recipe(request):
    return HttpResponse('<h1>new_recipe<h1>')

def groceries(request):
    return HttpResponse('<h1>groceries<h1>')

def mealplans(request):
    return HttpResponse('<h1>mealplans<h1>')

def new_meal_plan(request):
    return HttpResponse('<h1>new_meal_plan<h1>')

def recipe_meal_plan(request):
    return HttpResponse('<h1>recipe_meal_plan<h1>')

def focus_meal_plans(request):
    return HttpResponse('<h1>focus_meal_plans<h1>')

def edit_meal_plan(request):
    return HttpResponse('<h1>edit_meal_plan<h1>')

def meal_plan_groceries(request):
    return HttpResponse('<h1>meal_plan_groceries<h1>')

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
    return HttpResponse('<h1>register<h1>')

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
