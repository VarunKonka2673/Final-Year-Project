"""
SocialGuard NLP Engine
Extracts textual intelligence, sentiment polarity, spam trigger density,
lexical diversity, and TF-IDF vector representations from social media bios and posts.
"""

import re
import math
from typing import Dict, List, Any, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

# Known spam, phishing, financial scam, and bot trigger words & patterns
SPAM_TRIGGER_WORDS = [
    "airdrop", "crypto", "free", "giveaway", "claim", "instant", "payout", "forex",
    "profit", "passive income", "whatsapp", "telegram", "dm for", "paid promo",
    "shoutout", "boost", "followers", "100x", "gem", "invest", "guaranteed",
    "voucher", "gift card", "elon musk", "uniswap", "binance", "metamask", "seed phrase",
    "hot girls", "spicy", "leak", "private chat", "win", "winner", "congratulations",
    "urgent", "wallet", "hard fork", "node", "support desk", "helpdesk", "dm me"
]

class SocialGuardNLPEngine:
    """
    Hybrid NLP feature extractor and TF-IDF vectorizer.
    """
    def __init__(self, max_features: int = 50):
        self.max_features = max_features
        self.vectorizer = TfidfVectorizer(
            max_features=max_features,
            stop_words='english',
            ngram_range=(1, 2),
            token_pattern=r'(?u)\b\w+\b'
        )
        self.is_fitted = False

    @staticmethod
    def clean_text(text: str) -> str:
        if not isinstance(text, str):
            return ""
        text = text.lower().strip()
        # Remove URLs
        text = re.sub(r'https?://\S+|www\.\S+', ' ', text)
        # Remove special characters but keep spaces
        text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    @staticmethod
    def calculate_spam_keyword_score(text: str) -> float:
        """Calculates proportion and density of spam keywords."""
        if not isinstance(text, str) or not text.strip():
            return 0.0
        text_lower = text.lower()
        match_count = sum(1 for trigger in SPAM_TRIGGER_WORDS if trigger in text_lower)
        # Normalized score between 0.0 and 1.0
        score = min(1.0, (match_count * 0.22))
        return round(float(score), 3)

    @staticmethod
    def calculate_sentiment_polarity(text: str) -> float:
        """
        Lightweight lexical sentiment polarity calculator [-1.0 to 1.0].
        Scams and promo bots often exhibit unnatural high positive hype ('BEST', 'AMAZING', 'FREE').
        """
        if not isinstance(text, str) or not text.strip():
            return 0.0
        
        pos_words = {"love", "great", "awesome", "good", "best", "happy", "amazing", "free", "win", "profit", "guaranteed", "gem", "top", "perfect", "excited", "beautiful", "kindness"}
        neg_words = {"bad", "hate", "scam", "fake", "loss", "terrible", "problem", "urgent", "warning", "lock", "error", "fail", "broken", "issue"}
        
        tokens = re.findall(r'\b\w+\b', text.lower())
        if not tokens:
            return 0.0
        
        pos_count = sum(1 for t in tokens if t in pos_words)
        neg_count = sum(1 for t in tokens if t in neg_words)
        
        total = pos_count + neg_count
        if total == 0:
            return 0.1 # Neutral baseline
        
        polarity = (pos_count - neg_count) / float(total)
        return round(float(polarity), 3)

    @staticmethod
    def calculate_lexical_diversity(text: str) -> float:
        """Type-Token Ratio (TTR): Unique words / Total words."""
        if not isinstance(text, str) or not text.strip():
            return 1.0
        tokens = re.findall(r'\b\w+\b', text.lower())
        if not tokens:
            return 1.0
        unique_tokens = set(tokens)
        return round(float(len(unique_tokens) / len(tokens)), 3)

    @staticmethod
    def calculate_uppercase_ratio(text: str) -> float:
        """Proportion of uppercase letters in raw text (used to detect aggressive caps spam)."""
        if not isinstance(text, str) or not text.strip():
            return 0.0
        letters = [c for c in text if c.isalpha()]
        if not letters:
            return 0.0
        upper = sum(1 for c in letters if c.isupper())
        return round(float(upper / len(letters)), 3)

    @staticmethod
    def calculate_repeated_text_ratio(text: str) -> float:
        """Detects repetitive spam phrasing or character spamming."""
        if not isinstance(text, str) or not text.strip():
            return 0.0
        tokens = re.findall(r'\b\w+\b', text.lower())
        if len(tokens) <= 2:
            return 0.0
        counts = {}
        for t in tokens:
            counts[t] = counts.get(t, 0) + 1
        max_rep = max(counts.values())
        return round(float(max_rep / len(tokens)), 3)

    def extract_text_features(self, bio: str, recent_post: str) -> Dict[str, float]:
        """Extracts individual NLP feature dict for single account prediction."""
        combined = f"{bio or ''} {recent_post or ''}".strip()
        
        return {
            "spam_keyword_score": self.calculate_spam_keyword_score(combined),
            "sentiment_polarity": self.calculate_sentiment_polarity(combined),
            "lexical_diversity": self.calculate_lexical_diversity(combined),
            "repeated_text_ratio": self.calculate_repeated_text_ratio(combined),
            "uppercase_ratio": self.calculate_uppercase_ratio(combined)
        }

    def fit_tfidf(self, text_list: List[str]):
        """Fits the TF-IDF vectorizer on combined text samples."""
        cleaned = [self.clean_text(t) for t in text_list]
        self.vectorizer.fit(cleaned)
        self.is_fitted = True
        return self

    def transform_tfidf(self, text_list: List[str]) -> np.ndarray:
        """Transforms text into TF-IDF sparse/dense matrix."""
        if not self.is_fitted:
            raise ValueError("TF-IDF Vectorizer has not been fitted yet.")
        cleaned = [self.clean_text(t) for t in text_list]
        return self.vectorizer.transform(cleaned).toarray()
