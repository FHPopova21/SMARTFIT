<h1 align="center">🧥 FitVision</h1>
<p align="center">
  <img src="./PresentationLayer/public/logo.png" alt="FitVision Logo" width="180"/>
</p>
<p align="center">
  <em>Интелигентна система за визуална препоръка на размери на дрехи и обувки при онлайн пазаруване</em>
</p>

---

## 🎯 Цел на проекта

**FitVision** е цялостна, научно обоснована софтуерна система, която съчетава машинно обучение (Machine Learning), компютърно зрение (Computer Vision) и 2D/3D визуализация върху анатомичен манекен, за да гарантира перфектния избор на размер на дрехи и обувки в онлайн търговията.

🔍 **Проблемът, който се решава:**
Чести връщания на поръчки, въглероден отпечатък от куриерски доставки и клиентска неудовлетвореност поради несъответствие между таблиците на производителите и реалните човешки пропорции.

---

## 🧠 Основни функционалности

- 📝 **About You Quiz**: Интерактивен многоетапен въпросник за събиране на телесни параметри (ръст, тегло, гръдна обиколка, сутиен/чашка за дами, талия, ханш, телосложение и лични стилови предпочитания за вталяване).
- 👗 **2D/3D Визуален Манекен**: Анатомичен силует на манекен, визуализиращ препоръчания (Regular Fit) и алтернативния размер с реалистично свиване (Slim / Snug Fit) или отпускане (Relaxed / Loose Fit), както и режим „Прозрачна материя“.
- 👟 **OpenCV Скенер за обувки**: Измерване на дължина и ширина на стъпалото чрез снимка върху стандартен лист А4 ($210 \times 297\text{ мм}$) и формулата по стандарта **ISO/TS 19407 (Mondopoint)**.
- 🤖 **Калибрирано машинно обучение**: `RandomForestClassifier` и `CalibratedClassifierCV`, обучени върху 6,000 синтетични и реални профила съгласно **ISO 8559-1**.
- 🛍️ **Модерен луксозен каталог**: Категорийни табове с живи броячи, детайлна разбивка на сантиметрите (ширина, дължина, ръкави), отзиви и търговски рейтинги.
- 🔐 **Ролева система**: Потребител (User), Търговец (Seller) и Администратор (Admin) с двуфакторна защита и цялостен одитен лог.

---

## 🛠️ Технологичен стек

| Категория | Технологии |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Tailwind CSS, Vite, Radix UI (shadcn), Lucide Icons |
| **Backend** | Python 3.12 / 3.13, Flask 3, Flask-Login, Flask-Mail, Flask-CORS, Flask-Migrate |
| **Machine Learning** | Scikit-Learn (`RandomForestClassifier`, `CalibratedClassifierCV`), Pandas, NumPy |
| **Computer Vision** | OpenCV (алгоритми за калибрация на формат А4, намиране на контури и репери) |
| **Database** | SQLite, SQLAlchemy 2.0 (ORM) |
| **Стандарти** | **ISO 8559-1** (Оразмеряване на облекло), **ISO/TS 19407** (Оразмеряване на обувки - Mondopoint) |
| **Методология** | **CRISP-DM** (Cross-Industry Standard Process for Data Mining) |
| **Тестване (QA)** | Python `unittest` (13 автоматизирани теста за автентикация, каталог и ML) |

---

## 🔑 Роли в системата

- 👤 **Потребител (User)**: Преминава About You Quiz, получава персонализирани препоръки за дрехи и обувки с визуализация на манекен, преглежда каталога и оставя отзиви.
- 🧵 **Търговец / Продавач (Seller)**: Добавя нови обяви с точни мерки в см (ширина, дължина, ръкав, еластичност), редактира и управлява своите наличности.
- 🛡️ **Администратор (Admin)**: Достъп до пълно аналитично табло, управление на потребители, обяви, препоръки и преглед на системните логове.

---

## 💻 Инструкции за стартиране на проекта

### 1️⃣ Клониране на хранилището

```bash
git clone https://github.com/YourUsername/2425-11-b-pp-student-practices-assignment-FHPopova21.git
cd 2425-11-b-pp-student-practices-assignment-FHPopova21
```

---

### 2️⃣ Създаване и активиране на виртуална среда (venv)

#### macOS / Linux:
```bash
python3 -m venv venv
source venv/bin/activate
```

#### Windows:
```cmd
python -m venv venv
venv\Scripts\activate.bat
```

---

### 3️⃣ Инсталиране на зависимостите

```bash
pip install -r requirements.txt
```

---

### 4️⃣ Стартиране на тестовете

```bash
./venv/bin/python -m unittest discover tests
```

---

### 5️⃣ Стартиране на сървърите

#### Бекенд (Flask API на порт 5001):
```bash
python app.py
```

#### Фронтенд (React на порт 8080):
```bash
cd PresentationLayer
npm install
npm run dev
```

Отворете [http://localhost:8080](http://localhost:8080) в браузъра.

---

## 🔬 Машинно обучение и EDA (CRISP-DM Архитектура)

Проектът разполага с напълно отделен и структуриран MLOps пайплайн (`ml_pipeline/`):

1. **Цялостно автоматизирано изпълнение (Data Prep -> EDA -> Training -> Model Registry)**:
   ```bash
   python ml_pipeline/pipeline.py
   ```

2. **Изпълнение по фази съгласно CRISP-DM**:
   - **Data Preparation (Генериране на данни):**
     ```bash
     python ml_pipeline/data_preparation/generate_dataset.py
     # Записва ml_pipeline/data/processed/training_data.csv (6,000 профила)
     ```
   - **Data Understanding (EDA анализ):**
     ```bash
     python ml_pipeline/data_understanding/eda_analysis.py
     # Генерира корелационни матрици и ml_pipeline/data_understanding/EDA_REPORT.md
     ```
   - **Training & Model Registry (Обучение и калибриране):**
     ```bash
     python ml_pipeline/training/train_model.py
     # Сравнява алгоритми, калибрира увереността и експортира модела в ml_pipeline/models/
     ```

---

## 📁 Структура на проекта

```
FitVision/
├── app/                              # Flask REST API Backend
│   ├── __init__.py                   # Application Factory (create_app)
│   ├── models.py                     # SQLAlchemy модели (User, Clothing, RecommendationHistory, Comment, BodyMeasurements)
│   ├── logging_config.py             # Логинг архитектура и ротация
│   ├── seed.py                       # Начални данни (Admin, Продавачи, Каталог)
│   ├── decorators.py                 # Ролеви декоратори (@seller_required, @admin_required)
│   ├── services/                     # Сървизен слой (recommendation_service, measurements_service)
│   └── routes/                       # API Blueprints (auth, clothing, user, admin, comments)
│
├── ml_pipeline/                      # CRISP-DM Machine Learning Pipeline
│   ├── data/                         # Референтни ISO стандарти и обработени данни
│   ├── data_understanding/           # EDA статистика и аналитичен доклад
│   ├── data_preparation/             # Генератор на данни
│   ├── training/                     # Обучение и оценка на моделите
│   └── models/                       # Model Registry
│
├── PresentationLayer/                # SPA Frontend (React + TypeScript + Vite + Tailwind)
│   ├── src/pages/
│   │   ├── Index.tsx                 # Landing Page с 3D Live Try-On манекен
│   │   ├── AboutYouQuiz.tsx          # Интерактивен въпросник за мерки и стил
│   │   ├── ClothingListing.tsx       # Каталог с табове, филтри и отзиви
│   │   ├── Recommendation.tsx        # Препоръки с калибриран визуален манекен
│   │   ├── ShoeRecommendation.tsx    # OpenCV A4 скенер по ISO/TS 19407
│   │   ├── Measurements.tsx          # Ръчен преглед и редакция на мерки
│   │   ├── SellerListings.tsx        # Управление на обяви от продавачи
│   │   └── AdminDashboard.tsx        # Административен контролен панел
│   ├── src/components/
│   │   ├── VisualFitMannequin.tsx    # 2D/3D манекен с диференциация на обеми
│   │   ├── ClothingCard.tsx          # Карта за дреха с мерки в см
│   │   └── Navbar.tsx                # Навигация с FitVision лого и роли
│   └── src/types/index.ts            # TypeScript интерфейси и типове
│
├── tests/                            # Автоматизирани тестове (13 теста)
├── instance/                         # SQLite база данни и ротиращи логове
├── Dockerfile & docker-compose.yml   # Контейнеризация
├── requirements.txt                  # Python зависимости
└── app.py                            # Входна точка за бекенда
```

---

## ✨ Автор

👩 **Филипа Попова** — Софтуерен разработчик, 11 "б" клас  
🏫 Направление „Приложно програмиране“, Coding Burgas  
📧 fhpopova21@codingburgas.bg
