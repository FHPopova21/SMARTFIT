#!/usr/bin/env python3
"""
Model Training & Evaluation Phase (CRISP-DM):
Модерен ML пайплайн за обучение и калибриране на модел за препоръка на размер (SmartFit).
- Предотвратява изтичането на данни (Zero Data Leakage).
- Сравнява множество алгоритми (Logistic Regression, Random Forest, HistGradientBoosting).
- Калибрира вероятностите за точно определяне на алтернативен размер (CalibratedClassifierCV).
- Експортира готовия модел в ml_pipeline/models/smartfit_model.pkl.
- Записва подробни метрики за оценка в ml_pipeline/training/model_evaluation.txt.
"""

import os
import logging
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, brier_score_loss

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PIPELINE_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, '..'))
DATA_PATH = os.path.join(PIPELINE_ROOT, 'data', 'processed', 'training_data.csv')
EVAL_PATH = os.path.join(PIPELINE_ROOT, 'training', 'model_evaluation.txt')
MODEL_PATH = os.path.join(PIPELINE_ROOT, 'models', 'smartfit_model.pkl')


def train_and_evaluate(data_path=DATA_PATH, eval_path=EVAL_PATH, model_path=MODEL_PATH):
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Дейтасетът не е открит на {data_path}. Моля, изпълнете първо generate_dataset.py.")

    df = pd.read_csv(data_path)
    logger.info(f"Зареден дейтасет с {len(df)} записа от {data_path}")

    numerical_features = ['height', 'weight', 'waist', 'chest', 'garment_width']
    categorical_features = ['gender', 'body_type', 'material', 'garment_type']

    # Кодиране на категорийните променливи
    label_encoders = {}
    for col in categorical_features:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        label_encoders[col] = le

    X = df[numerical_features + categorical_features].copy()
    y = df['size']

    # 1. ПЪРВО: Разделяне на тренировъчно и тестово множество (Zero Data Leakage)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    logger.info(f"Train samples: {len(X_train)}, Test samples: {len(X_test)}")

    # 2. Скалиране само на числовите признаци: fit върху Train, transform върху Test
    scaler = StandardScaler()
    X_train_num_scaled = scaler.fit_transform(X_train[numerical_features])
    X_test_num_scaled = scaler.transform(X_test[numerical_features])

    X_train_processed = np.column_stack([X_train_num_scaled, X_train[categorical_features].values])
    X_test_processed = np.column_stack([X_test_num_scaled, X_test[categorical_features].values])

    # 3. Сравнение на алгоритми
    models = {
        'Logistic Regression (Baseline)': LogisticRegression(max_iter=1000, random_state=42),
        'Random Forest': RandomForestClassifier(n_estimators=300, max_depth=16, min_samples_split=4, random_state=42, n_jobs=-1),
        'HistGradientBoosting': HistGradientBoostingClassifier(max_iter=250, learning_rate=0.08, max_depth=10, random_state=42)
    }

    results = {}
    best_model_name = None
    best_accuracy = 0.0

    logger.info("=== Сравнение на алгоритмите ===")
    for name, model in models.items():
        model.fit(X_train_processed, y_train)
        train_acc = model.score(X_train_processed, y_train)
        test_acc = model.score(X_test_processed, y_test)
        results[name] = {'train_acc': train_acc, 'test_acc': test_acc, 'model': model}
        logger.info(f"{name:30} | Train Acc: {train_acc:.3f} | Test Acc: {test_acc:.3f}")

        if test_acc > best_accuracy:
            best_accuracy = test_acc
            best_model_name = name

    logger.info(f"🏆 Избран най-добър базов модел: {best_model_name} (Test Acc: {best_accuracy:.3f})")
    chosen_base_model = results[best_model_name]['model']

    # 4. Калибриране на вероятностите (Probability Calibration)
    logger.info("Калибриране на вероятностите чрез CalibratedClassifierCV...")
    calibrated_model = CalibratedClassifierCV(chosen_base_model, method='sigmoid', cv=3)
    calibrated_model.fit(X_train_processed, y_train)

    final_train_acc = calibrated_model.score(X_train_processed, y_train)
    final_test_acc = calibrated_model.score(X_test_processed, y_test)
    y_pred = calibrated_model.predict(X_test_processed)
    y_proba = calibrated_model.predict_proba(X_test_processed)

    report_str = classification_report(y_test, y_pred, digits=3)
    cm = confusion_matrix(y_test, y_pred, labels=calibrated_model.classes_)

    # Brier score за надеждност на вероятностния скор
    brier_scores = []
    for idx, cls_name in enumerate(calibrated_model.classes_):
        brier_scores.append(brier_score_loss(y_test == cls_name, y_proba[:, idx]))
    avg_brier = float(np.mean(brier_scores))

    # Важност на признаците (ако е Random Forest или дървовиден модел)
    feature_names = numerical_features + categorical_features
    feature_importance_df = None
    if hasattr(chosen_base_model, 'feature_importances_'):
        feature_importance_df = pd.DataFrame({
            'feature': feature_names,
            'importance': chosen_base_model.feature_importances_
        }).sort_values('importance', ascending=False)
        logger.info(f"\nFeature Importance:\n{feature_importance_df.to_string(index=False)}")

    # 5. Записване на детайлна оценка във файл
    os.makedirs(os.path.dirname(eval_path), exist_ok=True)
    with open(eval_path, 'w', encoding='utf-8') as f:
        f.write("==================================================\n")
        f.write("      SMARTFIT ML MODEL EVALUATION REPORT        \n")
        f.write("==================================================\n\n")
        f.write(f"Избран алгоритъм: {best_model_name} (Calibrated)\n")
        f.write(f"Крайна точност (Train Accuracy): {final_train_acc:.4f}\n")
        f.write(f"Крайна точност (Test Accuracy):  {final_test_acc:.4f}\n")
        f.write(f"Среден Brier Score:              {avg_brier:.4f}\n\n")
        f.write("Сравнителни резултати от бенчмарка:\n")
        for m_name, res in results.items():
            f.write(f" - {m_name:30}: Train={res['train_acc']:.3f}, Test={res['test_acc']:.3f}\n")
        f.write("\nПодробен Classification Report:\n")
        f.write(report_str + "\n\n")
        f.write("Матрица на объркване (Confusion Matrix):\n")
        f.write(f"Класове: {list(calibrated_model.classes_)}\n")
        f.write(str(cm) + "\n\n")
        if feature_importance_df is not None:
            f.write("Важност на признаците (Feature Importance):\n")
            f.write(feature_importance_df.to_string(index=False) + "\n")

    logger.info(f"Докладът за оценка е запазен в: {eval_path}")

    # 6. Записване на готовия модел и препроцесори в папката с модели (Model Registry)
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    model_data = {
        'model': calibrated_model,
        'scaler': scaler,
        'label_encoders': label_encoders,
        'numerical_features': numerical_features,
        'categorical_features': categorical_features,
        'feature_importance': feature_importance_df,
        'best_algorithm': best_model_name,
        'classes': list(calibrated_model.classes_)
    }

    joblib.dump(model_data, model_path, compress=3)
    logger.info(f"✅ Моделът и препроцесорите са успешно експортирани в: {model_path}")

    return {
        'model_path': model_path,
        'test_accuracy': final_test_acc,
        'brier_score': avg_brier
    }


if __name__ == '__main__':
    train_and_evaluate()

