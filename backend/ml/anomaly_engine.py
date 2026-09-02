"""
SocialGuard Anomaly & Coordinated Cluster Detection Engine
Uses Isolation Forest to catch zero-day / unseen abnormal bot signatures
and DBSCAN + PCA to identify coordinated bot networks and follow-farms.
"""

from typing import Dict, List, Any, Tuple
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.cluster import DBSCAN
from sklearn.decomposition import PCA

class SocialGuardAnomalyEngine:
    """
    Unsupervised detection of anomalous accounts and coordinated bot ring clusters.
    """
    def __init__(self, contamination: float = 0.25, random_state: int = 42):
        self.isolation_forest = IsolationForest(
            n_estimators=150,
            contamination=contamination,
            random_state=random_state,
            n_jobs=-1
        )
        self.dbscan = DBSCAN(eps=0.15, min_samples=6)
        self.pca = PCA(n_components=2, random_state=random_state)
        self.is_fitted = False

    def fit(self, X_scaled: np.ndarray):
        """Fits Isolation Forest, DBSCAN, and 2D PCA projection on scaled dataset."""
        self.isolation_forest.fit(X_scaled)
        self.pca.fit(X_scaled)
        self.is_fitted = True
        return self

    def score_anomaly_single(self, x_vector: np.ndarray) -> Dict[str, Any]:
        """
        Scores a single feature vector:
        Returns anomaly_score [0 to 100], is_anomaly (True/False), and 2D PCA coordinate.
        """
        if not self.is_fitted:
            raise ValueError("Anomaly Engine has not been fitted.")
        
        raw_score = self.isolation_forest.decision_function(x_vector)[0]
        # Invert and normalize decision function to a 0-100 anomaly index
        # raw_score < 0 is classified as anomaly by scikit-learn
        normalized_anomaly_score = max(0.0, min(100.0, (0.25 - raw_score) * 120.0))
        is_anomaly = bool(self.isolation_forest.predict(x_vector)[0] == -1)
        
        pca_coords = self.pca.transform(x_vector)[0]

        return {
            "anomaly_score": round(float(normalized_anomaly_score), 2),
            "is_anomaly": is_anomaly,
            "raw_decision_score": round(float(raw_score), 4),
            "pca_x": round(float(pca_coords[0]), 3),
            "pca_y": round(float(pca_coords[1]), 3)
        }

    def generate_cluster_visualization_data(self, X_scaled: np.ndarray, labels: List[int], archetypes: List[str], max_points: int = 600) -> Dict[str, Any]:
        """
        Generates 2D PCA coordinates and DBSCAN clusters for frontend interactive visualization.
        """
        if not self.is_fitted:
            raise ValueError("Anomaly Engine has not been fitted.")

        # Project the ENTIRE dataset to 2D PCA first
        pca_all = self.pca.transform(X_scaled)
        
        # Fit and predict DBSCAN clusters on the 2D PCA projection of the ENTIRE dataset
        dbscan_clusters_all = self.dbscan.fit_predict(pca_all)

        # Subsample for smooth web rendering
        if len(X_scaled) > max_points:
            indices = np.random.choice(len(X_scaled), size=max_points, replace=False)
            X_sub = X_scaled[indices]
            labels_sub = [labels[i] for i in indices]
            archetypes_sub = [archetypes[i] for i in indices]
            pca_2d = pca_all[indices]
            dbscan_clusters = dbscan_clusters_all[indices]
        else:
            X_sub = X_scaled
            labels_sub = labels
            archetypes_sub = archetypes
            pca_2d = pca_all
            dbscan_clusters = dbscan_clusters_all

        iso_preds = self.isolation_forest.predict(X_sub) # -1: anomaly, 1: normal
        iso_scores = self.isolation_forest.decision_function(X_sub)

        points = []
        for idx in range(len(X_sub)):
            norm_anomaly = max(0.0, min(100.0, (0.25 - iso_scores[idx]) * 120.0))
            points.append({
                "id": idx,
                "x": round(float(pca_2d[idx, 0]), 3),
                "y": round(float(pca_2d[idx, 1]), 3),
                "cluster_id": int(dbscan_clusters[idx]), # -1 is noise, >=0 is coordinated cluster
                "is_fake": int(labels_sub[idx]),
                "archetype": str(archetypes_sub[idx]),
                "anomaly_score": round(float(norm_anomaly), 1),
                "is_isolation_anomaly": bool(iso_preds[idx] == -1)
            })

        cluster_counts = {}
        for c in dbscan_clusters:
            c_int = int(c)
            cluster_counts[c_int] = cluster_counts.get(c_int, 0) + 1

        return {
            "total_points": len(points),
            "points": points,
            "cluster_summary": {
                "num_coordinated_clusters": len([c for c in cluster_counts.keys() if c >= 0]),
                "cluster_sizes": cluster_counts
            },
            "pca_explained_variance": [round(float(v), 4) for v in self.pca.explained_variance_ratio_]
        }
