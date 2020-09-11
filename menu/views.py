from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.

def index(request): 
    return render(request, 'menu/index.html')

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
    return HttpResponse('<h1>login_view<h1>')

def logout_view(request):
    return HttpResponse('<h1>logout_view<h1>')

def register(request):
    return HttpResponse('<h1>register<h1>')
