from django.db import models
from Test.models import Contest,User,Challenges

class Score(models.Model):
    contest=models.ForeignKey(Contest,on_delete=models.CASCADE,default=None,null=True)
    user=models.ForeignKey(User,on_delete=models.CASCADE)
    challenge=models.ForeignKey(Challenges,on_delete=models.CASCADE)
    score=models.IntegerField(default=0)
    solved=models.JSONField(default=dict,null=True)
    time=models.TimeField(default=None,null=True)

class Testcase(models.Model):
    question_number=models.IntegerField(default=0)
    input=models.TextField(default=None,null=True)
    output=models.TextField(default=None,null=True)

class slug_map(models.Model):
    slug=models.JSONField(default=None,null=True)

class Leetcode_Description(models.Model):
    number=models.IntegerField(default=0)
    description=models.TextField(default=None,null=True)
    input_description=models.TextField(default=None,null=True)

