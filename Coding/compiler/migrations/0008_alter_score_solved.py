from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ("compiler", "0007_score_solved"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE compiler_score
                ALTER COLUMN solved
                SET DATA TYPE jsonb
                USING to_jsonb(solved);
            """,
            reverse_sql="""
                ALTER TABLE compiler_score
                ALTER COLUMN solved
                SET DATA TYPE integer
                USING solved::integer;
            """
        )
    ]
