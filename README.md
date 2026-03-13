# Customer Intelligence Platform – Análisis de Churn y Soporte a Decisiones de Negocio

Este proyecto simula una **plataforma de inteligencia de clientes** diseñada para ayudar a las empresas a entender el comportamiento de sus usuarios, reducir el churn (abandono de clientes) y apoyar la toma de decisiones basada en datos.

La plataforma combina **análisis de datos, machine learning y dashboards interactivos** para transformar datos de clientes en información útil para negocio.

---

# Problema de negocio

El abandono de clientes (churn) es uno de los problemas más costosos para empresas con modelos de suscripción.

Captar un nuevo cliente puede costar **entre 5 y 7 veces más que retener uno existente**, por lo que identificar clientes con riesgo de abandono es clave para mejorar la rentabilidad.

El objetivo de este proyecto es:

- Analizar el comportamiento de los clientes
- Identificar los factores que influyen en el churn
- Predecir qué clientes tienen mayor riesgo de abandonar
- Proporcionar herramientas visuales para apoyar decisiones de negocio

---

# Dataset

El proyecto utiliza el dataset **Telco Customer Churn**, que contiene información sobre clientes de una empresa de telecomunicaciones, incluyendo:

- información demográfica
- servicios contratados
- tipo de contrato
- facturación y método de pago
- antigüedad del cliente (tenure)
- estado de churn

Estas variables permiten analizar patrones de comportamiento asociados con la retención de clientes.

---

# Arquitectura del proyecto

El sistema está construido utilizando una **arquitectura basada en microservicios** orquestada con Docker Compose.

Componentes principales:

Frontend  
Dashboard interactivo desarrollado con **React + Vite** para visualizar métricas de negocio.

Backend API  
API REST desarrollada con **Node.js + Express** que expone métricas y datos analíticos.

Servicio de Machine Learning  
Servicio en **Python + FastAPI** encargado de realizar predicciones de churn.

Base de datos  
**MySQL** para almacenar información de clientes y predicciones.

Pipeline ETL  
Scripts en **Python** para limpieza de datos, feature engineering y generación de predicciones.

---

# Flujo de análisis

El proyecto sigue un flujo típico utilizado en proyectos reales de analítica:

1. Ingesta y limpieza de datos (ETL)
2. Análisis exploratorio de datos (EDA)
3. Ingeniería de variables
4. Entrenamiento y evaluación del modelo
5. Generación de predicciones
6. Visualización de métricas en dashboards

---

# Principales insights del análisis

El análisis exploratorio revela varios patrones relevantes:

• Los clientes con **contratos mensuales (month-to-month)** presentan tasas de churn significativamente más altas  
• Los **clientes más recientes** tienen mayor probabilidad de abandonar el servicio  
• Algunos **métodos de pago** están asociados con mayor riesgo de churn  

Estos resultados sugieren que las estrategias de retención deberían centrarse en:

- mejorar la experiencia del cliente en los primeros meses
- incentivar contratos de mayor duración
- aplicar campañas de retención en segmentos de alto riesgo

---

# Modelo de Machine Learning

Se entrenó un modelo de **Logistic Regression** para estimar la probabilidad de churn de cada cliente.

El modelo utiliza variables relacionadas con:

- características del cliente
- servicios contratados
- facturación
- antigüedad

El modelo genera:

- probabilidad de churn
- análisis de importancia de variables
- predicciones para todos los clientes

Esto permite identificar **clientes con alto riesgo de abandono**.

---

# Aplicaciones para negocio

La plataforma permite a los equipos de negocio:

- Monitorizar tendencias de churn
- Identificar segmentos de clientes de alto riesgo
- Priorizar estrategias de retención
- Apoyar decisiones basadas en datos

Por ejemplo, los equipos de marketing podrían lanzar campañas específicas para clientes con **alta probabilidad de abandono**.

---

# Dashboard

El dashboard incluye visualizaciones como:

- distribución del churn
- segmentación de clientes por riesgo
- variables más influyentes en el churn
- clientes con mayor probabilidad de abandono
- métricas resumen del negocio

Estas visualizaciones permiten entender rápidamente la situación de la base de clientes.

---

# Tecnologías utilizadas

Python  
pandas  
scikit-learn  

Node.js  
Express  

React  
Vite  

MySQL  

Docker  
Docker Compose

---

# Posibles mejoras futuras

- predicciones en tiempo real
- alertas automáticas de churn
- experimentos A/B para estrategias de retención
- integración con herramientas de marketing

---

# Autor

Asier Rodríguez  
Proyectos de Data Science y Analítica de Datos