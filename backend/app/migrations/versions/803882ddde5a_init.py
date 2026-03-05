"""init

Revision ID: 803882ddde5a
Revises: b6c78ff1f05c
Create Date: 2026-03-05 11:56:49.303939

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel

revision: str = "803882ddde5a"
down_revision: Union[str, Sequence[str], None] = "b6c78ff1f05c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### tables ###
    op.create_table(
        "follows",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("follower_id", sa.Uuid(), nullable=False),
        sa.Column("following_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["follower_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["following_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("follower_id", "following_id", name="uq_follow"),
    )
    op.create_index(op.f("ix_follows_created_at"), "follows", ["created_at"], unique=False)
    op.create_index(op.f("ix_follows_follower_id"), "follows", ["follower_id"], unique=False)
    op.create_index(op.f("ix_follows_following_id"), "follows", ["following_id"], unique=False)

    op.create_table(
        "posts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("author_id", sa.Uuid(), nullable=False),
        sa.Column("caption", sqlmodel.sql.sqltypes.AutoString(length=2200), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_posts_author_id"), "posts", ["author_id"], unique=False)
    op.create_index(op.f("ix_posts_created_at"), "posts", ["created_at"], unique=False)

    op.create_table(
        "comments",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("post_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("text", sqlmodel.sql.sqltypes.AutoString(length=2000), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["post_id"], ["posts.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_comments_created_at"), "comments", ["created_at"], unique=False)
    op.create_index(op.f("ix_comments_post_id"), "comments", ["post_id"], unique=False)
    op.create_index(op.f("ix_comments_user_id"), "comments", ["user_id"], unique=False)

    op.create_table(
        "likes",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("post_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["post_id"], ["posts.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "post_id", name="uq_like"),
    )
    op.create_index(op.f("ix_likes_created_at"), "likes", ["created_at"], unique=False)
    op.create_index(op.f("ix_likes_post_id"), "likes", ["post_id"], unique=False)
    op.create_index(op.f("ix_likes_user_id"), "likes", ["user_id"], unique=False)

    op.create_table(
        "post_media",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("post_id", sa.Uuid(), nullable=False),
        sa.Column("url", sqlmodel.sql.sqltypes.AutoString(length=500), nullable=False),
        sa.Column("media_type", sa.Enum("image", "video", name="media_type_enum"), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["post_id"], ["posts.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_post_media_post_id"), "post_media", ["post_id"], unique=False)
    op.create_index(op.f("ix_post_media_sort_order"), "post_media", ["sort_order"], unique=False)

    # ### users columns (SAFE MIGRATION) ###
    # 1) add as nullable first (so existing rows won't violate)
    op.add_column("users", sa.Column("email", sqlmodel.sql.sqltypes.AutoString(length=120), nullable=True))
    op.add_column("users", sa.Column("password_hash", sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column("users", sa.Column("full_name", sqlmodel.sql.sqltypes.AutoString(length=80), nullable=True))
    op.add_column("users", sa.Column("bio", sqlmodel.sql.sqltypes.AutoString(length=160), nullable=True))
    op.add_column("users", sa.Column("avatar_url", sqlmodel.sql.sqltypes.AutoString(length=400), nullable=True))

    # 2) backfill email/password_hash for existing users
    # email: username@local.invalid (unique enough for existing unique usernames)
    op.execute("""
        UPDATE users
        SET email = COALESCE(email, username || '@local.invalid')
        WHERE email IS NULL
    """)

    # password_hash: set a non-empty placeholder for existing rows
    # (users created before auth won't be able to login until you implement reset/change password)
    op.execute("""
        UPDATE users
        SET password_hash = COALESCE(password_hash, 'LEGACY_NO_PASSWORD')
        WHERE password_hash IS NULL
    """)

    # 3) enforce NOT NULL after backfill
    op.alter_column("users", "email", existing_type=sqlmodel.sql.sqltypes.AutoString(length=120), nullable=False)
    op.alter_column("users", "password_hash", existing_type=sqlmodel.sql.sqltypes.AutoString(), nullable=False)

    # 4) indexes/constraints
    op.create_index(op.f("ix_users_created_at"), "users", ["created_at"], unique=False)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)


def downgrade() -> None:
    # rollback indexes first
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_index(op.f("ix_users_created_at"), table_name="users")

    # drop added columns
    op.drop_column("users", "avatar_url")
    op.drop_column("users", "bio")
    op.drop_column("users", "full_name")
    op.drop_column("users", "password_hash")
    op.drop_column("users", "email")

    # drop post_media
    op.drop_index(op.f("ix_post_media_sort_order"), table_name="post_media")
    op.drop_index(op.f("ix_post_media_post_id"), table_name="post_media")
    op.drop_table("post_media")

    # drop likes
    op.drop_index(op.f("ix_likes_user_id"), table_name="likes")
    op.drop_index(op.f("ix_likes_post_id"), table_name="likes")
    op.drop_index(op.f("ix_likes_created_at"), table_name="likes")
    op.drop_table("likes")

    # drop comments
    op.drop_index(op.f("ix_comments_user_id"), table_name="comments")
    op.drop_index(op.f("ix_comments_post_id"), table_name="comments")
    op.drop_index(op.f("ix_comments_created_at"), table_name="comments")
    op.drop_table("comments")

    # drop posts
    op.drop_index(op.f("ix_posts_created_at"), table_name="posts")
    op.drop_index(op.f("ix_posts_author_id"), table_name="posts")
    op.drop_table("posts")

    # drop follows
    op.drop_index(op.f("ix_follows_following_id"), table_name="follows")
    op.drop_index(op.f("ix_follows_follower_id"), table_name="follows")
    op.drop_index(op.f("ix_follows_created_at"), table_name="follows")
    op.drop_table("follows")

