from django.db import models
from django.contrib.postgres.fields import ArrayField



class User(models.Model):
    full_name=models.TextField(default=None,null=True)
    email=models.TextField(default=None,null=True)
    profile_photo = models.URLField(default=None, null=True)

class Rank(models.Model):
    user=models.ForeignKey(User,on_delete=models.CASCADE)
    rank=models.JSONField(default=dict)

class Contest(models.Model):
    user=models.ForeignKey(User,on_delete=models.CASCADE,null=True)
    contest_name=models.CharField(max_length=100,default=None)
    description=models.TextField(blank=True,default="")
    link=models.URLField(default=None,null=True)
    start_date=models.DateField()
    start_time=models.TimeField()
    end_date=models.DateField()
    end_time=models.TimeField()
    is_public=models.BooleanField(default=True)
    participants=models.IntegerField(default=0)
    number_of_entries=models.IntegerField(default=2147483647)
    created_at=models.DateTimeField(auto_now_add=True)

class Challenges(models.Model):
    contest=models.ForeignKey(Contest,on_delete=models.CASCADE,null=True)
    challenge_name=models.TextField(default=None)
    max_score=models.IntegerField(default=None,null=True)
    difficulty_level=models.TextField(default=None)
    problem_statement=models.TextField(default=None)
    constraints=models.TextField(default=None)
    input_form=models.TextField(default=None)
    output_form=models.TextField(default=None)    
    input_testcase=models.FileField(upload_to='testcase/',default=None,null=True)
    output_testcase=models.FileField(upload_to='output/',default=None,null=True)
    sample_testcase=models.TextField(default=None,null=True)
    sample_output=models.TextField(default=None,null=True)
    isLeetCode=models.BooleanField(default=False)
    cpp_code=models.TextField(default=None,null=True)
    python_code=models.TextField(default=None,null=True)
    java_code=models.TextField(default=None,null=True)
