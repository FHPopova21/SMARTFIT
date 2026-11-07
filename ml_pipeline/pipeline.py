#!/usr/bin/env python3
"""
Master Machine Learning Pipeline Runner (CRISP-DM Lifecycle):
1. Data Preparation: Генериране на антропометрично коректен дейтасет (generate_dataset)
2. Data Understanding: Статистическо изследване и структуриран доклад (run_eda)
3. Model Training & Evaluation: Обучение, крос-валидация, калибриране и оценка (train_and_evaluate)
4. Model Export: Запис на готовия сериализиран артефакт в ml_pipeline/models/smartfit_model.pkl
"""

import sys
import os
import time

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from ml_pipeline.data_preparation.generate_dataset import generate_dataset
from ml_pipeline.data_understanding.eda_analysis import run_eda
from ml_pipeline.training.train_model import train_and_evaluate


def run_full_pipeline():
    print("=" * 65)
    print("   🚀 SMARTFIT MACHINE LEARNING PIPELINE EXECUTION (CRISP-DM)")
    print("=" * 65)
    start_time = time.time()

    # СТЪПКА 1: Подготовка на данните (Data Preparation)
    print("\n[СТЪПКА 1/3] Стартиране на Data Preparation (Генериране на данни)...")
    generate_dataset(n_samples=6000)

    # СТЪПКА 2: Изследване на данните (Data Understanding / EDA)
    print("\n[СТЪПКА 2/3] Стартиране на Data Understanding (EDA & Статистики)...")
    run_eda()

    # СТЪПКА 3: Обучение, калибриране и валидация на модела (Modeling & Evaluation)
    print("\n[СТЪПКА 3/3] Обучение на моделите, сравнение и калибриране...")
    result = train_and_evaluate()

    elapsed = time.time() - start_time
    print("\n" + "=" * 65)
    print(f"🎉 ML Пайплайнът завърши успешно за {elapsed:.2f} секунди!")
    print(f"📊 Тестова точност на финалния модел: {result['test_accuracy'] * 100:.2f}%")
    print(f"🎯 Среден Brier Score: {result['brier_score']:.4f}")
    print(f"💾 Моделният артефакт е записан в: {result['model_path']}")
    print("=" * 65)


if __name__ == '__main__':
    run_full_pipeline()

