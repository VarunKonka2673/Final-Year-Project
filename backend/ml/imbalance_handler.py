"""
SocialGuard Class Imbalance Handler
Applies SMOTE (Synthetic Minority Over-sampling Technique) to ensure robust detection
of fraudulent minority classes without dataset bias or information leakage.
"""

from typing import Tuple, Dict, Any
import numpy as np
from imblearn.over_sampling import SMOTE, BorderlineSMOTE

class SocialGuardImbalanceHandler:
    """
    Handles class imbalance using SMOTE techniques.
    """
    def __init__(self, sampling_strategy: float = 0.85, method: str = "smote", random_state: int = 42):
        self.sampling_strategy = sampling_strategy
        self.method = method
        self.random_state = random_state
        
        if method == "borderline":
            self.oversampler = BorderlineSMOTE(
                sampling_strategy=sampling_strategy,
                random_state=random_state,
                k_neighbors=5
            )
        else:
            self.oversampler = SMOTE(
                sampling_strategy=sampling_strategy,
                random_state=random_state,
                k_neighbors=5
            )

    def balance_training_split(self, X_train: np.ndarray, y_train: np.ndarray) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
        """
        Applies oversampling to the training split ONLY (preventing test leakage).
        Returns balanced X_resampled, y_resampled, and class count statistics.
        """
        unique_orig, counts_orig = np.unique(y_train, return_counts=True)
        stats_orig = dict(zip([int(u) for u in unique_orig], [int(c) for c in counts_orig]))

        X_resampled, y_resampled = self.oversampler.fit_resample(X_train, y_train)

        unique_res, counts_res = np.unique(y_resampled, return_counts=True)
        stats_resampled = dict(zip([int(u) for u in unique_res], [int(c) for c in counts_res]))

        imbalance_report = {
            "method": self.method,
            "original_counts": stats_orig,
            "resampled_counts": stats_resampled,
            "synthetic_samples_generated": int(len(y_resampled) - len(y_train))
        }

        return X_resampled, y_resampled, imbalance_report
