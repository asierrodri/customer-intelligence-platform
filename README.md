# Customer Intelligence Platform

Customer Intelligence Platform es un proyecto de **analítica de datos y machine learning** diseñado para **identificar, explicar y priorizar el riesgo de abandono de clientes (churn)**.

El objetivo no es solo construir un modelo predictivo, sino desarrollar una **herramienta de apoyo a la toma de decisiones** que permita entender por qué los clientes abandonan y cómo priorizar acciones de retención.

La plataforma combina **análisis de datos, machine learning y un dashboard interactivo** para transformar datos de clientes en **insights accionables para negocio**.

---

# Objetivos del proyecto

El proyecto se centra en tres objetivos principales:

## 1. Entender el comportamiento de churn
Identificar los factores estructurales que influyen en el abandono de clientes, como el tipo de contrato o la antigüedad.

## 2. Predecir el riesgo de abandono
Entrenar un modelo de machine learning capaz de estimar la **probabilidad de churn de cada cliente**.

## 3. Priorizar acciones de negocio
Identificar clientes con mayor riesgo y priorizar aquellos con **mayor impacto económico**.

El resultado final es un **dashboard interactivo** que permite analizar el churn desde distintas perspectivas.

---

# Dashboard

El dashboard proporciona una visión completa del churn en diferentes niveles.

## Indicadores clave de negocio

El primer bloque muestra métricas que permiten dimensionar el problema:

- **Churn rate**
- **Clientes que han abandonado**
- **Ingresos mensuales en riesgo**
- **Base total de clientes analizada**

Estas métricas permiten entender rápidamente el impacto del churn en el negocio.

---

## Análisis de churn

El dashboard permite identificar los principales factores estructurales que influyen en el abandono.

### Churn por tipo de contrato

El análisis muestra una tasa de churn significativamente mayor en clientes con contrato **month-to-month** frente a contratos de mayor duración.

Esto sugiere que incentivar contratos más largos puede reducir el abandono.

### Churn por antigüedad del cliente

Los clientes con menor antigüedad presentan mayor probabilidad de churn, especialmente durante el primer año.

Esto indica que el **primer año de relación con el cliente es un periodo crítico para la retención**.

---

## Modelo de Machine Learning

El proyecto incluye un modelo de predicción de churn que estima la probabilidad de abandono para cada cliente.

Para facilitar la interpretación del modelo se incluyen dos visualizaciones.

### Segmentación de riesgo

Los clientes se agrupan en tres categorías:

- bajo riesgo
- riesgo medio
- alto riesgo

Esto permite entender cómo se distribuye el riesgo dentro de la base de clientes.

### Principales variables del modelo

El gráfico de importancia de variables muestra los factores que más influyen en la predicción de churn, entre ellos:

- antigüedad del cliente
- tipo de servicio de internet
- cargos mensuales

Este análisis ayuda a explicar el comportamiento del modelo.

---

## Priorización de clientes

El dashboard transforma las predicciones en información accionable.

### Clientes con mayor riesgo de churn

Se muestra un ranking de clientes con mayor probabilidad de abandono.

Esto permite identificar rápidamente casos prioritarios para acciones de retención.

### Clientes de alto valor en riesgo

Además del riesgo de churn, el dashboard identifica clientes que combinan:

- **alto riesgo de abandono**
- **alto valor económico**

Esto permite priorizar acciones sobre los clientes con mayor impacto potencial en ingresos.

---

# Stack tecnológico

## Data & Machine Learning

- Python  
- pandas  
- scikit-learn  
- feature engineering  
- modelo de predicción de churn  

## Backend

- Node.js  
- Express  
- API REST  
- endpoint de inferencia del modelo  

## Frontend

- React  
- Apache ECharts  
- dashboard interactivo  

## Base de datos

- MySQL

---

# Estructura del proyecto

- api/ → backend Node.js y API REST
- ml/ → pipeline de machine learning
- frontend/ → dashboard en React
- data/ → dataset y scripts de preparación


---

# Conclusiones

Este proyecto muestra cómo integrar machine learning dentro de un flujo de analítica orientado a negocio.

El enfoque no se centra únicamente en el modelo, sino en:

- analizar el comportamiento de churn
- predecir el riesgo de abandono
- explicar las variables clave
- priorizar acciones de retención con mayor impacto económico

El objetivo es **convertir datos en decisiones accionables**.

---

# Mejoras futuras

Algunas posibles extensiones del proyecto:

- simulación de estrategias de retención
- modelos de **Customer Lifetime Value**
- experimentos A/B para campañas de retención
- monitorización del modelo en producción

---

# Autor

**Asier Rodríguez**