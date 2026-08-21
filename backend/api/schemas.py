"""
SocialGuard Pydantic Schemas
Defines request and response data models for API communication.
"""

from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field

class AccountInputSchema(BaseModel):
    username: str = Field(..., example="crypto_guru_88")
    full_name: Optional[str] = Field(None, example="Crypto Signals VIP")
    bio: Optional[str] = Field("", example="Daily 100x signals! Join free Telegram channel now 🚀")
    recent_post: Optional[str] = Field("", example="Airdrop live now! Claim $5000 in bio 🎁")
    has_profile_pic: int = Field(0, ge=0, le=1, description="1 if avatar present, 0 otherwise")
    is_verified: int = Field(0, ge=0, le=1, description="1 if verified badge, 0 otherwise")
    account_age_days: float = Field(0.0, ge=0, description="Age of account in days")
    follower_count: float = Field(0.0, ge=0, description="Number of followers")
    following_count: float = Field(0.0, ge=0, description="Number of accounts followed")
    posts_count: float = Field(0.0, ge=0, description="Total number of posts")
    has_url: int = Field(0, ge=0, le=1, description="1 if profile bio contains URL link")
    has_contact_info: int = Field(0, ge=0, le=1, description="1 if email/phone present")
    posting_frequency_per_day: float = Field(0.0, ge=0, description="Average posts published per day")
    avg_engagement_rate: float = Field(0.0, ge=0, description="Average engagement percentage (%)")
    avg_likes_per_post: Optional[float] = Field(0.0, ge=0)
    avg_retweets_or_shares: Optional[float] = Field(0.0, ge=0)
    like_to_share_ratio: Optional[float] = Field(0.0, ge=0)
    mention_count_avg: Optional[float] = Field(0.0, ge=0)
    hashtag_count_avg: Optional[float] = Field(0.0, ge=0)
    url_in_post_ratio: Optional[float] = Field(0.0, ge=0, le=1.0)
    active_hours_entropy: Optional[float] = Field(0.0, ge=0, le=5.0)
    
    # Platform-specific features
    platform: Optional[str] = Field("Generic Web", description="Platform name")
    followers: Optional[float] = Field(None, description="Alias for follower_count")
    following: Optional[float] = Field(None, description="Alias for following_count")
    media_count: Optional[float] = Field(None)
    connections: Optional[float] = Field(None)
    likes_count: Optional[float] = Field(None)
    video_count: Optional[float] = Field(None)
    tweet_count: Optional[float] = Field(None)
    is_premium: Optional[int] = Field(None)
    experience_count: Optional[int] = Field(None)
    education_count: Optional[int] = Field(None)
    skills_count: Optional[int] = Field(None)
    is_private: Optional[int] = Field(None)
    profile_pic: Optional[str] = Field(None)
    headline: Optional[str] = Field(None)
    display_name: Optional[str] = Field(None)

class BatchAccountInputSchema(BaseModel):
    accounts: List[AccountInputSchema]

class RetrainRequestSchema(BaseModel):
    num_samples: Optional[int] = Field(6000, ge=500, le=25000)
    fake_ratio: Optional[float] = Field(0.28, ge=0.05, le=0.60)
    smote_ratio: Optional[float] = Field(0.85, ge=0.5, le=1.0)
