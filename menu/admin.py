from django.contrib import admin

from .models import User, Tag, Category, Food, Ingredient, Recipe, MealPlan

# Register your models here.

admin.site.register(User)
admin.site.register(Tag)
admin.site.register(Category)
admin.site.register(Food)
admin.site.register(Ingredient)
admin.site.register(Recipe)
admin.site.register(MealPlan)