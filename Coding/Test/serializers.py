from rest_framework import serializers
from .models import Contest,Challenges

class ContestSerializer(serializers.ModelSerializer):
    organizer = serializers.SerializerMethodField()

    class Meta:
        model = Contest
        fields = '__all__'  # Keeps all original fields
        # OR: list fields manually if you want full control

    def get_organizer(self, obj):
        return obj.user.full_name if obj.user else None


class ChallengeSerializer(serializers.ModelSerializer):
        input_testcase = serializers.FileField(use_url=True)
        output_testcase = serializers.FileField(use_url=True)

        class Meta:
            model=Challenges
            fields='__all__'        