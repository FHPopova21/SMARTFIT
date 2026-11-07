# SmartFit Machine Learning Pipeline (CRISP-DM Architecture)

Тази директория капсулира целия жизнен цикъл на машинното обучение на **SmartFit**, отделен от уеб сървъра според принципите на **CRISP-DM** и **MLOps**:

```
ml_pipeline/
├── data/
│   ├── raw/
│   │   └── standards_reference.json   # Референтни стандарти (ISO 8559, EN 13402)
│   └── processed/
│       └── training_data.csv          # 6,000 изчистени и нормализирани записа
│
├── data_understanding/
│   ├── eda_analysis.py                # Скрипт за статистическо изследване на данните (EDA)
│   └── EDA_REPORT.md                  # Пълен аналитичен доклад (разпределения, корелации)
│
├── data_preparation/
│   └── generate_dataset.py            # Антропометричен синтетичен генератор на данни
│
├── training/
│   ├── train_model.py                 # Бенчмарк, крос-валидация и калибрация на модели
│   └── model_evaluation.txt           # Детайлни метрики (Confusion Matrix, F1, Brier Score)
│
├── models/
│   └── smartfit_model.pkl             # Моделен артефакт (Calibrated HistGradientBoosting)
│
├── pipeline.py                        # Главен оркестратор на целия пайплайн
└── README.md                          # Тази документация
```

---

## 🔄 Как да стартирате пайплайна

### 1. Пълен автоматичен цикъл (One-Command Execution)
От главната директория на проекта:
```bash
python ml_pipeline/pipeline.py
```
Този скрипт изпълнява последователно:
1. `generate_dataset.py` -> Генерира 6,000 антропометрични профила в `ml_pipeline/data/processed/training_data.csv`.
2. `eda_analysis.py` -> Анализира статистическите свойства и генерира `ml_pipeline/data_understanding/EDA_REPORT.md`.
3. `train_model.py` -> Сравнява 3 алгоритъма, калибрира вероятностите, записва метриките в `ml_pipeline/training/model_evaluation.txt` и експортира сериализирания модел в `ml_pipeline/models/smartfit_model.pkl`.

---

### 2. Изпълнение на отделните фази

- **Data Preparation (Подготовка на данни):**
  ```bash
  python ml_pipeline/data_preparation/generate_dataset.py
  ```

- **Data Understanding (EDA анализ):**
  ```bash
  python ml_pipeline/data_understanding/eda_analysis.py
  ```

- **Training & Model Registry (Обучение и запис на модела):**
  ```bash
  python ml_pipeline/training/train_model.py
  ```

