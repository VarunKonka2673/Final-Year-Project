"""
SocialGuard Multi-Model Classification Suite
Trains, tunes, evaluates, and compares 6 machine learning classifiers:
1. Random Forest
2. Decision Tree
3. Support Vector Machine (Calibrated SVC)
4. Logistic Regression
5. K-Nearest Neighbors (KNN)
6. Gradient Boosting Classifier
"""

from typing import Dict, Any, List, Tuple
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.svm import LinearSVC
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report,
    roc_curve
)

class SocialGuardModelSuite:
    """
    Manages multi-model training, benchmarking, and inference.
    """
    def __init__(self, random_state: int = 42):
        self.random_state = random_state
        self.models: Dict[str, Any] = {
            "Random Forest": RandomForestClassifier(
                n_estimators=150,
                max_depth=14,
                min_samples_split=4,
                random_state=random_state,
                n_jobs=-1
            ),
            "Decision Tree": DecisionTreeClassifier(
                max_depth=8,
                min_samples_leaf=3,
                random_state=random_state
            ),
            "SVM (Calibrated)": CalibratedClassifierCV(
                LinearSVC(C=1.0, max_iter=3000, random_state=random_state),
                cv=3
            ),
            "Logistic Regression": LogisticRegression(
                C=1.0,
                max_iter=1500,
                random_state=random_state
            ),
            "K-Nearest Neighbors": KNeighborsClassifier(
                n_neighbors=7,
                weights='distance',
                n_jobs=-1
            ),
            "Gradient Boosting": GradientBoostingClassifier(
                n_estimators=120,
                learning_rate=0.1,
                max_depth=5,
                random_state=random_state
            )
        }
        self.evaluation_results: Dict[str, Any] = {}
        self.feature_names: List[str] = []
        self.best_model_name: str = "Random Forest"

    def train_and_evaluate_all(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_test: np.ndarray,
        y_test: np.ndarray,
        feature_names: List[str]
    ) -> Dict[str, Any]:
        """
        Trains all 6 classifiers and computes comparative performance benchmarks.
        """
        self.feature_names = feature_names
        results = {}

        best_f1 = -1.0
        best_name = "Random Forest"

        for name, model in self.models.items():
            print(f"Training {name}...")
            model.fit(X_train, y_train)

            # Predictions
            y_pred = model.predict(X_test)
            
            if hasattr(model, "predict_proba"):
                y_prob = model.predict_proba(X_test)[:, 1]
            elif hasattr(model, "decision_function"):
                df_scores = model.decision_function(X_test)
                y_prob = 1 / (1 + np.exp(-df_scores))
            else:
                y_prob = y_pred.astype(float)

            # Metrics
            acc = float(accuracy_score(y_test, y_pred))
            prec = float(precision_score(y_test, y_pred, zero_division=0))
            rec = float(recall_score(y_test, y_pred, zero_division=0))
            f1 = float(f1_score(y_test, y_pred, zero_division=0))
            
            try:
                auc = float(roc_auc_score(y_test, y_prob))
                fpr, tpr, _ = roc_curve(y_test, y_prob)
                # Sample ROC curve points for frontend chart rendering
                sample_indices = np.linspace(0, len(fpr) - 1, min(30, len(fpr))).astype(int)
                roc_points = [{"fpr": round(float(fpr[i]), 4), "tpr": round(float(tpr[i]), 4)} for i in sample_indices]
            except Exception:
                auc = 0.5
                roc_points = [{"fpr": 0.0, "tpr": 0.0}, {"fpr": 1.0, "tpr": 1.0}]

            cm = confusion_matrix(y_test, y_pred).tolist() # [[TN, FP], [FN, TP]]

            results[name] = {
                "accuracy": round(acc * 100, 2),
                "precision": round(prec * 100, 2),
                "recall": round(rec * 100, 2),
                "f1_score": round(f1 * 100, 2),
                "roc_auc": round(auc * 100, 2),
                "confusion_matrix": {
                    "true_negative": cm[0][0],
                    "false_positive": cm[0][1],
                    "false_negative": cm[1][0],
                    "true_positive": cm[1][1],
                    "matrix": cm
                },
                "roc_curve": roc_points,
                "classification_report": classification_report(y_test, y_pred, output_dict=True, zero_division=0)
            }

            if f1 > best_f1:
                best_f1 = f1
                best_name = name

        self.best_model_name = best_name
        self.evaluation_results = results

        # Global Feature Importances from the best ensemble models
        feature_importance_list = self._extract_feature_importances()

        summary_table = []
        for name, metrics in results.items():
            summary_table.append({
                "model_name": name,
                "accuracy": metrics["accuracy"],
                "precision": metrics["precision"],
                "recall": metrics["recall"],
                "f1_score": metrics["f1_score"],
                "roc_auc": metrics["roc_auc"],
                "is_best": bool(name == self.best_model_name)
            })

        # Sort summary by F1-Score descending
        summary_table.sort(key=lambda x: x["f1_score"], reverse=True)

        return {
            "best_model": self.best_model_name,
            "models_comparison": summary_table,
            "detailed_metrics": results,
            "feature_importances": feature_importance_list
        }

    def _extract_feature_importances(self) -> List[Dict[str, Any]]:
        """Extracts top feature importances from Random Forest or Gradient Boosting."""
        rf = self.models.get("Random Forest")
        if rf and hasattr(rf, "feature_importances_") and len(self.feature_names) == len(rf.feature_importances_):
            importances = rf.feature_importances_
        else:
            gb = self.models.get("Gradient Boosting")
            if gb and hasattr(gb, "feature_importances_") and len(self.feature_names) == len(gb.feature_importances_):
                importances = gb.feature_importances_
            else:
                return []

        fi = []
        for name, score in zip(self.feature_names, importances):
            fi.append({
                "feature": name,
                "importance_pct": round(float(score * 100), 2)
            })
        
        fi.sort(key=lambda x: x["importance_pct"], reverse=True)
        return fi

    def predict_ensemble(self, x_vector: np.ndarray) -> Dict[str, Any]:
        """
        Runs prediction across all 6 models and computes weighted ensemble consensus.
        """
        model_predictions = {}
        probabilities = []

        for name, model in self.models.items():
            pred = int(model.predict(x_vector)[0])
            
            if hasattr(model, "predict_proba"):
                prob = float(model.predict_proba(x_vector)[0, 1])
            elif hasattr(model, "decision_function"):
                df_scores = model.decision_function(x_vector)[0]
                prob = float(1 / (1 + np.exp(-df_scores)))
            else:
                prob = float(pred)

            probabilities.append(prob)
            model_predictions[name] = {
                "prediction": "Fake / Bot" if pred == 1 else "Genuine",
                "is_fake": pred,
                "fake_probability": round(prob * 100, 2)
            }

        # Mean ensemble probability
        avg_prob = float(np.mean(probabilities))
        final_verdict = 1 if avg_prob >= 0.50 else 0
        confidence = avg_prob if final_verdict == 1 else (1.0 - avg_prob)

        return {
            "ensemble_verdict": "Fake / Fraudulent" if final_verdict == 1 else "Genuine / Authentic",
            "is_fake": final_verdict,
            "risk_score": round(avg_prob * 100, 2), # 0 to 100 risk
            "confidence_pct": round(confidence * 100, 2),
            "model_breakdown": model_predictions
        }
