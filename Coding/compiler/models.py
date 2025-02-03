from django.db import models
from Test.models import Contest,User,Challenges

class Score(models.Model):
    contest=models.ForeignKey(Contest,on_delete=models.CASCADE,default=None,null=True)
    user=models.ForeignKey(User,on_delete=models.CASCADE)
    challenge=models.ForeignKey(Challenges,on_delete=models.CASCADE)
    score=models.IntegerField(default=0)