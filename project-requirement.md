# Interview Tasks

# Task 1: Housing Price Prediction Model API

## Objective

Build, containerise, and deploy a simple regression model that predicts housing prices based on provided features (dataset attached).

## Requirements

### API Endpoints

1. `predict` - Accepts housing features and returns price predictions. Both single and batch numbers.
2. `model-info` - Returns model coefficients and performance metrics.
3. `health` - Simple health check endpoint.

## Technical Constraints

* Python 3.12+
* FastAPI
* Scikit-learn

## Deliverables

1. Source code in GitHub.
2. Dockerfile.
3. Ability to show this live during interview via Swagger/OpenAPI.

# Task 2: Multi-Application Next.js Portal

## Objective

Create a unified Next.js portal that hosts two independent applications with different backend technologies, both capable of interacting with the ML model from Task 1.

## Portal Structure Requirements

### 1. Unified Navigation & Layout

* Implement a shared layout with navigation between applications.
* Use Next.js App Router for routing between and within applications.
* Create a consistent design system across both applications.
* Properly handle loading and error states at the layout level.

### 2. App 1: Property Value Estimator (Python Backend)

#### Frontend

* Create a form for inputting property details, including all fields from the model.
* Implement client-side validation with appropriate error messages.
* Display prediction results in both tabular format and a visual chart.
* Implement a history feature showing previous estimates.
* Create a comparison view to analyse multiple properties side-by-side.

#### Backend (Python)

* Handle form submissions.
* Integrate with the regression model container from Task 1.
* Implement data validation and error handling.

### 3. App 2: Property Market Analysis (Java Backend)

#### Frontend

* Create an interactive dashboard with property market visualisations.
* Implement filters for analysing different property segments.
* Build a "what-if" analysis tool using the model.
* Provide data export options:

  * CSV
  * PDF
* Create responsive data tables with sorting and filtering.

#### Backend (Java)

* Create REST API endpoints for market analysis.
* Generate aggregate statistics from the housing dataset.
* Integrate with the ML model container from Task 1.
* Implement caching for performance optimisation.

## Technical Requirements

### 1. Next.js Implementation

* Use App Router.
* Implement Server Components and Client Components appropriately.
* Use React Server Components for initial data loading.
* Implement proper data-fetching strategies.
* Create custom hooks for shared functionality.

### 2. UI/UX Requirements

* Create responsive layouts using Tailwind CSS.
* Implement accessible UI components following WCAG guidelines.
* Use appropriate loading states and error boundaries.
* Create smooth transitions between pages and application states.
* Design a cohesive UI that follows modern design principles.

### 3. State Management & Data Flow

* Implement appropriate client-side state management.
* Handle form state effectively with validation.
* Create efficient data-fetching patterns.
* Properly manage API communication and error states.

### 4. Code Quality & Organisation

* Structure the codebase following Next.js best practices.

## Technical Constraints

* Python 3.12+
* FastAPI
* Java 21
* Spring Boot 3.4.4

## Deliverables

1. Source code in GitHub.
2. Ability to show this live during interview.
