from django.db import models

# Create your models here.
class Brewery(models.Model):
    name = models.CharField(max_length=64)
    location = models.CharField(max_length=64)
