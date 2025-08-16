from django.db import models

class Challenges(models.Model):
    id = models.BigAutoField(primary_key=True)
    challenge_name = models.TextField()
    max_score = models.IntegerField(blank=True, null=True)
    difficulty_level = models.TextField()
    problem_statement = models.TextField()
    constraints = models.TextField()
    input_form = models.TextField()
    output_form = models.TextField()
    input_testcase = models.CharField(max_length=100, blank=True, null=True)
    output_testcase = models.CharField(max_length=100, blank=True, null=True)
    sample_testcase = models.TextField(blank=True, null=True)
    sample_output = models.TextField(blank=True, null=True)
    contest = models.ForeignKey('Contest', models.DO_NOTHING, blank=True, null=True)
    cpp_code = models.TextField(blank=True, null=True)
    isleetcode = models.BooleanField(db_column='isLeetCode')
    java_code = models.TextField(blank=True, null=True)
    python_code = models.TextField(blank=True, null=True)
    leetcodenumber = models.TextField(db_column='leetCodeNumber', blank=True, null=True) 

    class Meta:
        managed = False
        db_table = 'Test_challenges'


class Contest(models.Model):
    id = models.BigAutoField(primary_key=True)
    contest_name = models.CharField(max_length=100)
    start_date = models.DateField()
    start_time = models.TimeField()
    end_date = models.DateField()
    end_time = models.TimeField()
    number_of_entries = models.IntegerField()
    user = models.ForeignKey('User', models.DO_NOTHING, blank=True, null=True)
    created_at = models.DateTimeField()
    description = models.TextField()
    is_public = models.BooleanField()
    link = models.CharField(max_length=200, blank=True, null=True)
    participants = models.IntegerField()
    number_of_challenges = models.IntegerField()
    number_of_participants = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'Test_contest'


class User(models.Model):
    id = models.BigAutoField(primary_key=True)
    full_name = models.TextField(blank=True, null=True)
    email = models.TextField(blank=True, null=True)
    profile_photo = models.CharField(max_length=200, blank=True, null=True)
    contest_created = models.IntegerField()
    contest_participated = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'Test_user'


class Leetcode_Description(models.Model):
    id = models.BigAutoField(primary_key=True)
    number = models.IntegerField()
    description = models.TextField(blank=True, null=True)
    input_description = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'compiler_leetcode_description'


class Score(models.Model):
    id = models.BigAutoField(primary_key=True)
    score = models.IntegerField()
    challenge = models.ForeignKey(Challenges, models.DO_NOTHING)
    user = models.ForeignKey(User, models.DO_NOTHING)
    contest = models.ForeignKey(Contest, models.DO_NOTHING, blank=True, null=True)
    time = models.TimeField(blank=True, null=True)
    solved = models.JSONField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'compiler_score'


class Testcase(models.Model):
    id = models.BigAutoField(primary_key=True)
    question_number = models.IntegerField()
    input = models.TextField(blank=True, null=True)
    output = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'compiler_testcase'
