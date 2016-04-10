from django.db import models

from datetime import datetime

# Create your models here.
class Brewery(models.Model):
    name = models.CharField(max_length=64)
    location = models.CharField(max_length=64)

class Recipe(models.Model):
    name = models.CharField(max_length=64)

class RecipeInstance(models.Model):
    recipe = models.ForeignKey(Recipe)
    date = models.DateField(default=datetime.now)

class Asset(models.Model):
    name=models.CharField(max_length=64)

class AssetSensor(models.Model):
    name=models.CharField(max_length=64)
    asset = models.ForeignKey(Asset)
    
class HeatedVessel(Asset):
    brewery = models.ForeignKey(Brewery)
    
class TimeSeriesDataPoint(models.Model):
    sensor = models.ForeignKey(AssetSensor)
    recipe_instance = models.ForeignKey(RecipeInstance)
    
    time = models.TimeField()
    value = models.FloatField()