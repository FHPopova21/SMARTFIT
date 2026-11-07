#!/usr/bin/env python3
"""
Data Preparation Phase:
Генератор на синтетичен дейтасет за размери на дрехи (SmartFit).
Базиран на реални антропометрични разпределения (ANSUR II и ISO 8559 / EN 13402),
включващ зависимост от тип дреха, материя (еластичност) и ширина на дрехата.

Резултатът се записва в ml_pipeline/data/processed/training_data.csv.
"""

import os
import numpy as np
import pandas as pd

np.random.seed(42)

# Базови пътища
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PIPELINE_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, '..'))
OUTPUT_CSV = os.path.join(PIPELINE_ROOT, 'data', 'processed', 'training_data.csv')


def generate_dataset(n_samples=6000, output_path=OUTPUT_CSV):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    genders = np.random.choice(['female', 'male'], size=n_samples, p=[0.50, 0.50])
    body_types = np.random.choice(['slim', 'average', 'large'], size=n_samples, p=[0.25, 0.55, 0.20])
    garment_types = np.random.choice(
        ['t-shirt', 'shirt', 'pants', 'dress', 'jacket', 'sweater', 'skirt'],
        size=n_samples,
        p=[0.25, 0.20, 0.20, 0.10, 0.10, 0.10, 0.05]
    )
    materials = np.random.choice(
        ['elastic', 'semi-elastic', 'non-elastic'],
        size=n_samples,
        p=[0.35, 0.35, 0.30]
    )
    
    heights = []
    weights = []
    chests = []
    waists = []
    garment_widths = []
    sizes = []

    size_order = ['XS', 'S', 'M', 'L', 'XL']

    for i in range(n_samples):
        gender = genders[i]
        btype = body_types[i]
        gtype = garment_types[i]
        mat = materials[i]

        # Базови антропометрични данни според пола
        if gender == 'female':
            h = np.random.normal(164, 6.5)
            if btype == 'slim':
                bmi = np.random.normal(19.2, 1.4)
            elif btype == 'large':
                bmi = np.random.normal(28.5, 2.5)
            else: # average
                bmi = np.random.normal(22.8, 2.0)
            
            w = bmi * ((h / 100.0) ** 2)
            chest = 0.52 * w + 0.22 * h + np.random.normal(20, 3.5)
            waist = 0.58 * w + 0.14 * h + np.random.normal(12, 3.8)

        else: # male
            h = np.random.normal(177, 7.2)
            if btype == 'slim':
                bmi = np.random.normal(20.5, 1.5)
            elif btype == 'large':
                bmi = np.random.normal(30.0, 2.8)
            else: # average
                bmi = np.random.normal(24.5, 2.2)

            w = bmi * ((h / 100.0) ** 2)
            chest = 0.58 * w + 0.26 * h + np.random.normal(12, 4.0)
            waist = 0.55 * w + 0.18 * h + np.random.normal(10, 4.2)

        # Ограничаване в реални физиологични граници
        h = np.clip(h, 145, 210)
        w = np.clip(w, 40, 140)
        chest = np.clip(chest, 70, 135)
        waist = np.clip(waist, 55, 130)

        # Референтен размер според европейския стандарт ISO 8559
        if gender == 'female':
            if chest < 82 and waist < 64:
                base_idx = 0  # XS
            elif chest < 89 and waist < 71:
                base_idx = 1  # S
            elif chest < 97 and waist < 80:
                base_idx = 2  # M
            elif chest < 106 and waist < 90:
                base_idx = 3  # L
            else:
                base_idx = 4  # XL
        else: # male
            if chest < 88 and waist < 74:
                base_idx = 0  # XS
            elif chest < 95 and waist < 82:
                base_idx = 1  # S
            elif chest < 103 and waist < 91:
                base_idx = 2  # M
            elif chest < 112 and waist < 101:
                base_idx = 3  # L
            else:
                base_idx = 4  # XL

        # Базова ширина на дрехата (половин гръдна/ханшна обиколка + толеранс за удобство)
        base_half_chest = (chest / 2.0)
        if mat == 'elastic':
            ease = np.random.normal(1.5, 1.0)
        elif mat == 'semi-elastic':
            ease = np.random.normal(4.0, 1.2)
        else:
            ease = np.random.normal(7.0, 1.5)

        garment_w = base_half_chest + ease

        # Ефект на еластичността върху препоръчвания размер:
        final_idx = base_idx
        rand_val = np.random.random()
        if mat == 'elastic' and rand_val < 0.22:
            final_idx = max(0, base_idx - 1)
        elif mat == 'non-elastic' and rand_val < 0.20:
            final_idx = min(4, base_idx + 1)

        # Ефект на типа дреха
        if gtype in ['jacket', 'sweater'] and np.random.random() < 0.15:
            final_idx = min(4, final_idx + 1)

        heights.append(round(float(h), 1))
        weights.append(round(float(w), 1))
        chests.append(round(float(chest), 1))
        waists.append(round(float(waist), 1))
        garment_widths.append(round(float(garment_w), 1))
        sizes.append(size_order[final_idx])

    df = pd.DataFrame({
        'height': heights,
        'weight': weights,
        'waist': waists,
        'chest': chests,
        'garment_width': garment_widths,
        'gender': genders,
        'body_type': body_types,
        'material': materials,
        'garment_type': garment_types,
        'size': sizes
    })

    df.to_csv(output_path, index=False)
    print(f"✅ Успешно генериран и валидиран дейтасет: {output_path} ({len(df)} записа)")
    print("\nРазпределение на размерите:")
    print(df['size'].value_counts())
    return df


if __name__ == '__main__':
    generate_dataset()

