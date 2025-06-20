from rest_framework import serializers
from .models import Contest,Challenges

class ContestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contest
        fields = '__all__'

class ChallengeSerializer(serializers.ModelSerializer):
    class Meta:
        model=Challenges
        fields='__all__'        