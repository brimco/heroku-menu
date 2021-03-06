from django.db import models
from django.contrib.auth.models import AbstractUser
import json
from datetime import date 

# Create your models here.

class User(AbstractUser):
    pass

class Tag(models.Model):
    name = models.CharField(max_length=64)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tags")   
    objects = models.Manager()

    def __str__(self):
        return self.name
    

def get_next_order():
        highest = Category.objects.aggregate(models.Max('order'))['order__max']
        if highest == None:
            highest = 0
        return highest + 1

class Category(models.Model):
    name = models.CharField(max_length=64)
    order = models.PositiveIntegerField(default=get_next_order)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="categories")   
    objects = models.Manager()

    def __str__(self):
        return self.name

class Food(models.Model):
    name = models.CharField(max_length=64)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, related_name='foods', null=True)
    on_grocery_list = models.BooleanField(default=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="foods")   
    objects = models.Manager()

    def __str__(self):
        return self.name

class Recipe(models.Model):
    name = models.CharField(max_length=64)
    tags = models.ManyToManyField(Tag, related_name='recipes', blank=True)
    prep_time = models.PositiveIntegerField(blank=True, null=True)
    cook_time = models.PositiveIntegerField(blank=True, null=True)
    source = models.CharField(max_length=256, blank=True)
    servings = models.PositiveIntegerField(blank=True, null=True)
    str_steps = models.TextField(blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="recipes")   
    objects = models.Manager()
    followed_by = models.ManyToManyField(User, related_name='followed_recipes', blank=True)

    def steps_fxn(self):
        # read str_steps and convert to list, and return list
        if self.str_steps:
            return json.loads(self.str_steps)
        return []

    # use this to read steps
    steps = property(steps_fxn)
    
    # use this to rewrite steps
    def set_steps(self, lst):
        self.str_steps = json.dumps(lst)

    def list_ingredients(self):
        ingredients = self.ingredients.all()
        length = len(ingredients)
        if length == 0:
            return 'None'
        elif length == 1:
            return ingredients[0].food.name
        elif length == 2:
            return ingredients[0].food.name + ' and ' + ingredients[1].food.name
        else:
            return ', '.join([i.food.name for i in ingredients[:(length - 1)]]) + ', and ' + ingredients[length - 1].food.name

    def set_following(self, username, is_following):
        user = User.objects.get(username=username)
        if is_following:
            self.followed_by.add(user)
        else:
            self.followed_by.remove(user)

    def __str__(self):
        return self.name

class Ingredient(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='ingredients')
    food = models.ForeignKey(Food, on_delete=models.PROTECT, related_name='ingredients')
    amount = models.CharField(max_length=64, blank=True, null=True)
    unit = models.CharField(max_length=64, blank=True)
    description = models.CharField(max_length=256, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="ingredients")   
    objects = models.Manager()

    def __str__(self):
        s = ''
        if self.amount:
            s += f' {self.amount}'
        if self.unit:
            s += f' {self.unit}'
        if self.food:
            s += f' {self.food.name}'
        if self.description:
            s += f', {self.description}'
        return s
            
class MealPlan(models.Model):
    date = models.DateField(default=date.today)
    notes = models.CharField(max_length=256, blank=True)
    recipes = models.ManyToManyField(Recipe, related_name='mealplans', blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="mealplans")   
    objects = models.Manager()

    def set_date(self, new_date):
        try:
            self.date = date.fromisoformat(new_date)
        except:
            self.date = new_date

    def __str__(self):
        return str(self.date)

class Feedback(models.Model):
    date = models.DateField(default=date.today)
    text = models.TextField()
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feedback')
    resolved = models.BooleanField(default=False)
    objects = models.Manager()

    def __str__(self):
        return f'{self.user}: {self.text[:20]}'
