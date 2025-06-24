from rest_framework import serializers
from .models import Contest,Challenges

class ContestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contest
        fields = '__all__'

class ChallengeSerializer(serializers.ModelSerializer):
     input_testcase = serializers.FileField(use_url=True)
     output_testcase = serializers.FileField(use_url=True)
    
     class Meta:
        model=Challenges
        fields='__all__'        