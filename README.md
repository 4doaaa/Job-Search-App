Job Search App
A professional backend system for managing job postings, company profiles, and applications, built with NestJS and MongoDB.

Key Features
Authentication and Identity: Secure login with JWT, Google OAuth 2.0 integration, and password management.

Company Management: Full CRUD operations for companies, including logo and cover uploads via Cloudinary.

Job Ecosystem: Comprehensive job posting, searching, and application tracking system.

Data Integrity: Automated cascading deletes using Mongoose Hooks (deleting a company removes all its jobs and applications).

Security First: Protected by Helmet, Rate-limiting, and CORS.

Reports: Ability to export job applications to Excel files.

Technical Implementation
Framework: NestJS (TypeScript) with a modular architecture.

Validation: Strict type safety using Global Validation Pipes and class-validator.

Database: MongoDB Atlas with Mongoose ODM.

Authorization: Role-based access control (Admin/User) using NestJS Guards.

How to Run
Clone the repository.

Install dependencies:
npm install --legacy-peer-deps

Set up your .env file (refer to .env.example).

Start the development server:
npm run start:dev

Postman Documentation
The Postman collection is included in the project files. Import it to test the APIs locally or via the deployed link.