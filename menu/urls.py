from django.urls import path

from . import views

app_name = 'menu'
urlpatterns = [
    path('', views.index, name='index'),
    path('recipes', views.recipes, name='recipes'),
    path('recipes/<int:recipe_id>', views.recipe, name='recipe'),
    path('recipes/<int:recipe_id>/addgroceries', views.recipe_groceries, name='recipe_groceries'),
    path('recipes/<int:recipe_id>/edit', views.edit_recipe, name='edit_recipe'),
    path('recipes/new', views.new_recipe, name='newrecipe'),
    path('groceries', views.groceries, name='groceries'),
    path('mealplans', views.mealplans, name='mealplans'),
    path('mealplans/new', views.new_meal_plan, name='new_meal_plan'),
    path('mealplans/new/<int:recipe_id>', views.recipe_meal_plan, name='recipe_meal_plan'),
    path('mealplans/<int:meal_plan_id>', views.focus_meal_plans, name='focus_meal_plans'),
    path('mealplans/<int:meal_plan_id>/edit', views.edit_meal_plan, name='edit_meal_plan'),
    path('mealplans/addgroceries', views.meal_plan_groceries, name='meal_plan_groceries'),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
]