"""
SocialGuard Dataset Generator
Generates realistic multi-platform social media account datasets for fraud/bot detection research.
Covers profile signals, behavioural patterns, textual bios/posts, and realistic bot archetypes.
"""

import os
import random
import numpy as np
import pandas as pd

# Seed for reproducibility
np.random.seed(42)
random.seed(42)

# NLP text pools for genuine and fraudulent accounts
GENUINE_BIOS = [
    "Tech enthusiast, coffee lover, software engineer based in Seattle. Opinions are my own.",
    "Photographer & world traveler | Capturing life one frame at a time 📸 | Contact: hello@janesmith.com",
    "Product Designer @FinTech. Passionate about UX, accessibility, and human-computer interaction.",
    "Mom, runner, high school biology teacher. Reading books and planting trees 🌿",
    "Data scientist exploring deep learning, NLP, and ethics in AI. Writing on Substack.",
    "Musician, guitarist, indie songwriter. New EP 'Midnight Echoes' streaming everywhere 🎵",
    "Digital nomad | Exploring Southeast Asia ✈️ | Sharing remote work tips & cafe spots.",
    "Chef & culinary blogger. Turning simple ingredients into Michelin-star vibes 🍳",
    "Fitness coach, certified nutritionist. Helping you reach peak health safely 💪",
    "Architecture student, visual artist, minimalist enthusiast. Design portfolio in link.",
    "Journalist covering climate resilience, renewable energy, and environmental policy 🌍",
    "Gamer, streamer, anime fan. Catch my live streams every Tuesday & Friday night on Twitch 🎮",
    "Economics researcher, avid cyclist, history podcast host. Views my own.",
    "Marketing director & brand strategist. Building communities that love great products.",
    "Passionate gardener, dog parent, baker of sourdough bread. Kindness matters ✨"
]

GENUINE_POSTS_SAMPLE = [
    "Just finished an incredible 10k morning run! The weather was crisp and perfect 🏃‍♂️",
    "Super excited to announce that our new open-source library just reached 1,000 GitHub stars!",
    "Had the best pour-over coffee this morning at the corner cafe. Highly recommend their Ethiopian roast.",
    "Reading 'Thinking, Fast and Slow' again. Every chapter gives a fresh perspective on cognitive bias.",
    "Sunset at the coast today was absolutely breathtaking. No filter needed 🌅",
    "Debugging code for 3 hours only to realize a missing semicolon is the universal programmer experience 😂",
    "Great conversation on tonight's panel regarding sustainable energy grids and local storage.",
    "Homemade pizza night! The crust fermented for 48 hours and it was worth every minute 🍕",
    "Attended an inspiring keynote on human-centered AI systems today. Great insights on ethical alignment.",
    "Happy weekend everyone! Make sure to unplug, recharge, and spend time with loved ones."
]

BOT_SPAM_BIOS = [
    "FREE CRYPTO AIRDROP 🚀 Join our VIP Telegram channel NOW for 100x signals & instant payouts! Click link 👇",
    "🔥 DM FOR PAID PROMOTIONS 🔥 100% real growth, shoutouts, viral boosts! Best rates guaranteed!",
    "Earn $500-$2000 DAILY from home! Guaranteed passive income with our automated forex trading bot 💰",
    "⚡ Official Customer Support Desk! Having wallet connection issues? DM us 24/7 for instant resolution!",
    "FREE GIFT CARDS! Claim your $100 Amazon / Shein voucher today! Limited spots available! 🎁 bit.ly/free-claim",
    "WANT 10K FOLLOWERS IN 1 HOUR? 🔥 Instant delivery, no password needed! Check bio link right now! 🚀",
    "🚀 Elon Musk Official Giveaway Fan Club! Send 0.1 ETH get 0.5 ETH back instantly! Valid for 24h only! 🪙",
    "🔥 EXCLUSIVE 18+ CONTENT 🔥 Free preview in bio link! Daily uploads & private chats! 💋",
    "Best IPTV Subscription 2026! 15,000+ channels, 4K movies, sports live! Instant activation on WhatsApp!",
    "Earn bitcoin while you sleep! Zero investment needed, 100% verified payout proof in highlights 💎"
]

BOT_SPAM_POSTS_SAMPLE = [
    "🚨 MASSIVE AIRDROP ALERT 🚨 Claim your 5,000 $TOKEN immediately! Visit: https://claim-rewards-secure.xyz",
    "DM ME FOR INSTANT CRYPTO SIGNALS 💸 98% WIN RATE! DON'T MISS THIS 100X GEM! 🚀🚀",
    "Want free followers? Send DM to @boost_kings_official right now for instant 5,000 followers! 🔥",
    "Urgent: Upgrade your wallet security node before the hard fork! Click link in bio to avoid account lock ⚠️",
    "Win a brand new iPhone 16 Pro Max! Like, Retweet, and click the link in bio to enter the draw! 🎁",
    "Passive income made easy! Made $4,200 this week alone. WhatsApp mentor +1-800-SPAM-BOT now 📈",
    "HOT NEW TOKEN LAUNCHING ON UNISWAP IN 10 MINUTES! GET IN EARLY BEFORE IT MOONS 🌕🪙",
    "Need fast loan approval without credit check? 0% interest for first 3 months! WhatsApp us today 💳",
    "CONGRATULATIONS! Your account was randomly selected for our $500 cash drop! Claim now at reward-link 💵",
    "Check out my exclusive spicy photos and private stream here: https://t.me/free_leak_scam_xyz 🔞"
]

BOT_ARCHETYPES = [
    "Crypto-Phishing-Bot",
    "Spam-Promoter-Bot",
    "Follower-Farm-Bot",
    "Impersonator-Scammer",
    "Automated-Content-Scraper"
]

GENUINE_ARCHETYPES = [
    "Genuine-Active-User",
    "Genuine-Casual-User",
    "Genuine-Creator-Influencer",
    "Genuine-Professional"
]

def generate_socialguard_dataset(num_samples: int = 6000, fake_ratio: float = 0.28) -> pd.DataFrame:
    """
    Generates a realistic dataset with multi-modal profile, behavioural, and textual features.
    Reflects real-world class imbalance where fake accounts are a ~25-30% minority.
    """
    num_fake = int(num_samples * fake_ratio)
    num_genuine = num_samples - num_fake

    records = []

    # Generate Genuine Accounts
    for i in range(num_genuine):
        archetype = random.choice(GENUINE_ARCHETYPES)
        username_base = random.choice(["alex", "sarah", "david", "elena", "marcus", "priya", "kevin", "chloe", "rachel", "liam", "zoe", "lucas", "maya"])
        has_digits = random.random() < 0.35
        username = f"{username_base}_{random.randint(10, 999)}" if has_digits else f"{username_base}_{random.choice(['dev', 'official', 'design', 'photo', 'life', 'studio'])}"
        
        full_name = f"{username_base.capitalize()} {random.choice(['Miller', 'Chen', 'Patel', 'Smith', 'Taylor', 'Garcia', 'Kovacs', 'Wong', 'Johnson', 'Davis'])}"
        
        # Profile signals
        has_profile_pic = 1 if random.random() < 0.98 else 0
        account_age_days = int(np.random.gamma(shape=3.0, scale=400.0) + 60) # Avg ~1200 days (~3.5 years)
        is_verified = 1 if (archetype == "Genuine-Creator-Influencer" and random.random() < 0.35) else (1 if random.random() < 0.04 else 0)
        has_url = 1 if random.random() < 0.45 else 0
        has_contact_info = 1 if random.random() < 0.60 else 0
        
        if archetype == "Genuine-Creator-Influencer":
            follower_count = int(np.random.exponential(scale=35000) + 8000)
            following_count = int(np.random.exponential(scale=600) + 150)
            posts_count = int(np.random.exponential(scale=450) + 100)
            posting_frequency_per_day = round(float(np.random.normal(1.2, 0.4)), 2)
            avg_engagement_rate = round(float(np.random.uniform(2.5, 8.0)), 2)
            avg_likes_per_post = round(follower_count * (avg_engagement_rate / 100.0) * random.uniform(0.7, 1.3), 1)
            avg_retweets_or_shares = round(avg_likes_per_post * random.uniform(0.08, 0.25), 1)
        elif archetype == "Genuine-Active-User":
            follower_count = int(np.random.exponential(scale=850) + 120)
            following_count = int(np.random.exponential(scale=700) + 150)
            posts_count = int(np.random.exponential(scale=280) + 40)
            posting_frequency_per_day = round(float(np.random.normal(0.8, 0.3)), 2)
            avg_engagement_rate = round(float(np.random.uniform(3.0, 12.0)), 2)
            avg_likes_per_post = round(follower_count * (avg_engagement_rate / 100.0), 1)
            avg_retweets_or_shares = round(avg_likes_per_post * random.uniform(0.05, 0.20), 1)
        else: # Casual / Professional
            follower_count = int(np.random.exponential(scale=350) + 45)
            following_count = int(np.random.exponential(scale=400) + 50)
            posts_count = int(np.random.exponential(scale=120) + 10)
            posting_frequency_per_day = round(float(np.random.normal(0.25, 0.15)), 2)
            avg_engagement_rate = round(float(np.random.uniform(4.0, 15.0)), 2)
            avg_likes_per_post = round(follower_count * (avg_engagement_rate / 100.0), 1)
            avg_retweets_or_shares = round(avg_likes_per_post * random.uniform(0.02, 0.15), 1)

        posting_frequency_per_day = max(0.02, posting_frequency_per_day)
        follower_to_following_ratio = round((follower_count + 1) / (following_count + 1), 3)
        
        # Behavioural patterns
        like_to_share_ratio = round(float(np.random.uniform(4.0, 18.0)), 2)
        mention_count_avg = round(float(np.random.uniform(0.1, 1.2)), 2)
        hashtag_count_avg = round(float(np.random.uniform(0.5, 3.5)), 2)
        url_in_post_ratio = round(float(np.random.uniform(0.02, 0.25)), 2)
        active_hours_entropy = round(float(np.random.uniform(2.8, 3.8)), 3)
        
        # Textual & NLP Signals
        bio = random.choice(GENUINE_BIOS)
        recent_post = random.choice(GENUINE_POSTS_SAMPLE)
        spam_keyword_score = round(float(np.random.uniform(0.0, 0.12)), 3)
        sentiment_polarity = round(float(np.random.uniform(-0.1, 0.75)), 3)
        lexical_diversity = round(float(np.random.uniform(0.70, 0.95)), 3)
        repeated_text_ratio = round(float(np.random.uniform(0.0, 0.15)), 3)
        uppercase_ratio = round(float(np.random.uniform(0.02, 0.12)), 3)
        
        records.append({
            "account_id": f"GEN_{i+10001}",
            "username": username,
            "full_name": full_name,
            "bio": bio,
            "recent_post": recent_post,
            "has_profile_pic": has_profile_pic,
            "is_verified": is_verified,
            "account_age_days": max(5, account_age_days),
            "follower_count": max(0, follower_count),
            "following_count": max(1, following_count),
            "posts_count": max(1, posts_count),
            "follower_to_following_ratio": follower_to_following_ratio,
            "has_url": has_url,
            "has_contact_info": has_contact_info,
            "posting_frequency_per_day": posting_frequency_per_day,
            "avg_engagement_rate": max(0.1, avg_engagement_rate),
            "avg_likes_per_post": max(0.1, avg_likes_per_post),
            "avg_retweets_or_shares": max(0.0, avg_retweets_or_shares),
            "like_to_share_ratio": like_to_share_ratio,
            "mention_count_avg": mention_count_avg,
            "hashtag_count_avg": hashtag_count_avg,
            "url_in_post_ratio": url_in_post_ratio,
            "active_hours_entropy": active_hours_entropy,
            "spam_keyword_score": spam_keyword_score,
            "sentiment_polarity": sentiment_polarity,
            "lexical_diversity": lexical_diversity,
            "repeated_text_ratio": repeated_text_ratio,
            "uppercase_ratio": uppercase_ratio,
            "bot_archetype": archetype,
            "is_fake": 0
        })

    # Generate Fraudulent / Bot Accounts
    for j in range(num_fake):
        archetype = random.choice(BOT_ARCHETYPES)
        
        if archetype == "Crypto-Phishing-Bot":
            username = f"{random.choice(['elon', 'binance', 'crypto', 'support', 'airdrop'])}_{random.choice(['help', 'official', 'rewards', 'fast'])}_{random.randint(1000, 99999)}"
            full_name = f"{random.choice(['Elon Musk Support', 'Ethereum Rewards', 'Crypto Whale Airdrops', 'Binance Helpdesk'])}"
        elif archetype == "Follower-Farm-Bot":
            username = f"user_{random.randint(1000000, 9999999)}"
            full_name = f"User {random.randint(1000, 9999)}"
        elif archetype == "Spam-Promoter-Bot":
            username = f"{random.choice(['promo', 'boost', 'viral', 'kings', 'growth'])}_{random.choice(['marketing', 'hub', 'agency'])}_{random.randint(100, 999)}"
            full_name = f"Social Growth Agency #{random.randint(1, 99)}"
        else:
            username = f"{random.choice(['fast_cash', 'gift_giveaway', 'hot_deals', 'stream_leak'])}_{random.randint(100, 99999)}"
            full_name = f"Official Giveaways {random.choice(['VIP', 'Global', 'Direct'])}"

        # Profile signals
        has_profile_pic = 1 if random.random() < 0.65 else 0
        account_age_days = int(np.random.exponential(scale=110) + 2)
        is_verified = 0
        has_url = 1 if random.random() < 0.92 else 0
        has_contact_info = 1 if random.random() < 0.40 else 0

        if archetype == "Follower-Farm-Bot":
            following_count = int(np.random.uniform(4000, 7500))
            follower_count = int(np.random.uniform(5, 80))
            posts_count = int(np.random.uniform(0, 15))
            posting_frequency_per_day = round(float(np.random.uniform(0.01, 0.2)), 2)
            avg_engagement_rate = round(float(np.random.uniform(0.01, 0.4)), 2)
        elif archetype == "Spam-Promoter-Bot" or archetype == "Automated-Content-Scraper":
            following_count = int(np.random.uniform(800, 4500))
            follower_count = int(np.random.uniform(100, 1200))
            posts_count = int(np.random.uniform(800, 9500))
            posting_frequency_per_day = round(float(np.random.uniform(15.0, 85.0)), 2)
            avg_engagement_rate = round(float(np.random.uniform(0.05, 0.8)), 2)
        elif archetype == "Crypto-Phishing-Bot":
            following_count = int(np.random.uniform(20, 300))
            follower_count = int(np.random.uniform(500, 4000))
            posts_count = int(np.random.uniform(10, 80))
            posting_frequency_per_day = round(float(np.random.uniform(4.0, 25.0)), 2)
            avg_engagement_rate = round(float(np.random.uniform(0.1, 1.2)), 2)
        else: # Impersonator
            following_count = int(np.random.uniform(100, 2000))
            follower_count = int(np.random.uniform(50, 600))
            posts_count = int(np.random.uniform(5, 50))
            posting_frequency_per_day = round(float(np.random.uniform(1.0, 8.0)), 2)
            avg_engagement_rate = round(float(np.random.uniform(0.05, 0.6)), 2)

        follower_to_following_ratio = round((follower_count + 1) / (following_count + 1), 3)
        avg_likes_per_post = round(follower_count * (avg_engagement_rate / 100.0) + random.uniform(0, 2), 1)
        avg_retweets_or_shares = round(avg_likes_per_post * random.uniform(0.01, 0.05), 1)
        
        # Behavioural signals
        like_to_share_ratio = round(float(np.random.uniform(0.5, 3.0)), 2)
        mention_count_avg = round(float(np.random.uniform(2.5, 9.0)), 2)
        hashtag_count_avg = round(float(np.random.uniform(6.0, 18.0)), 2)
        url_in_post_ratio = round(float(np.random.uniform(0.65, 0.98)), 2)
        active_hours_entropy = round(float(np.random.uniform(0.2, 1.6)), 3)

        # Textual & NLP Signals
        bio = random.choice(BOT_SPAM_BIOS)
        recent_post = random.choice(BOT_SPAM_POSTS_SAMPLE)
        spam_keyword_score = round(float(np.random.uniform(0.55, 0.98)), 3)
        sentiment_polarity = round(float(np.random.uniform(0.45, 0.95)), 3)
        lexical_diversity = round(float(np.random.uniform(0.25, 0.55)), 3)
        repeated_text_ratio = round(float(np.random.uniform(0.50, 0.95)), 3)
        uppercase_ratio = round(float(np.random.uniform(0.25, 0.75)), 3)

        records.append({
            "account_id": f"BOT_{j+10001}",
            "username": username,
            "full_name": full_name,
            "bio": bio,
            "recent_post": recent_post,
            "has_profile_pic": has_profile_pic,
            "is_verified": is_verified,
            "account_age_days": max(1, account_age_days),
            "follower_count": max(0, follower_count),
            "following_count": max(1, following_count),
            "posts_count": max(0, posts_count),
            "follower_to_following_ratio": follower_to_following_ratio,
            "has_url": has_url,
            "has_contact_info": has_contact_info,
            "posting_frequency_per_day": max(0.01, posting_frequency_per_day),
            "avg_engagement_rate": max(0.01, avg_engagement_rate),
            "avg_likes_per_post": max(0.0, avg_likes_per_post),
            "avg_retweets_or_shares": max(0.0, avg_retweets_or_shares),
            "like_to_share_ratio": like_to_share_ratio,
            "mention_count_avg": mention_count_avg,
            "hashtag_count_avg": hashtag_count_avg,
            "url_in_post_ratio": url_in_post_ratio,
            "active_hours_entropy": active_hours_entropy,
            "spam_keyword_score": spam_keyword_score,
            "sentiment_polarity": sentiment_polarity,
            "lexical_diversity": lexical_diversity,
            "repeated_text_ratio": repeated_text_ratio,
            "uppercase_ratio": uppercase_ratio,
            "bot_archetype": archetype,
            "is_fake": 1
        })

    df = pd.DataFrame(records)
    df = df.sample(frac=1.0, random_state=42).reset_index(drop=True)
    return df

def save_default_dataset(output_dir: str = None) -> str:
    """Generates and saves the default SocialGuard benchmark dataset."""
    if output_dir is None:
        output_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(output_dir, exist_ok=True)
    
    file_path = os.path.join(output_dir, "socialguard_dataset.csv")
    df = generate_socialguard_dataset(num_samples=6000, fake_ratio=0.28)
    df.to_csv(file_path, index=False)
    print(f"Generated SocialGuard dataset: {df.shape[0]} records ({df['is_fake'].sum()} fake, {(df['is_fake']==0).sum()} genuine) saved to {file_path}")
    return file_path

if __name__ == "__main__":
    save_default_dataset()
