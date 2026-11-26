"""add up_depth, down_depth, collateral_depth to arbres

Revision ID: 151de0adb7cc
Revises: 5dbe15feab38
Create Date: 2026-08-20 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '151de0adb7cc'
down_revision = '5dbe15feab38'
branch_labels = None
depends_on = None


def upgrade():
    # server_default='1' pour que les lignes existantes soient back-fillées
    # automatiquement (au lieu d'échouer sur NOT NULL) ; on retire le
    # server_default juste après pour laisser Python gérer les valeurs
    # par défaut à partir de maintenant, comme pour les autres colonnes.
    op.add_column('arbres', sa.Column('up_depth', sa.Integer(), nullable=False, server_default='1'))
    op.add_column('arbres', sa.Column('down_depth', sa.Integer(), nullable=False, server_default='1'))
    op.add_column('arbres', sa.Column('collateral_depth', sa.Integer(), nullable=False, server_default='1'))

    with op.batch_alter_table('arbres') as batch_op:
        batch_op.alter_column('up_depth', server_default=None)
        batch_op.alter_column('down_depth', server_default=None)
        batch_op.alter_column('collateral_depth', server_default=None)


def downgrade():
    op.drop_column('arbres', 'collateral_depth')
    op.drop_column('arbres', 'down_depth')
    op.drop_column('arbres', 'up_depth')