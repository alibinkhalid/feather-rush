<h1 align="center">Feather Rush</h1>



<p align="center">

&#x20; Flap. Dodge. Soar through 10 worlds.

</p>



<p align="center">

&#x20; A modern browser-based arcade flying game built with Next.js, React, and TypeScript.

</p>



\---



\# About



Feather Rush is a browser-based arcade game where players guide a small bird through increasingly challenging obstacles while collecting coins and achieving the highest possible score.



Inspired by classic endless-runner and flappy-style games, Feather Rush combines simple controls with progressively difficult gameplay to create an engaging experience that is easy to learn but challenging to master.



The game runs entirely in the browser and requires no additional software or plugins.



\---



\# Screenshots



\## Main Menu



!\[Main Menu](./screenshots/home-screen.png)



\## Gameplay



!\[Gameplay](./screenshots/gameplay.png)



\## Game Over Screen



!\[Game Over](./screenshots/game-over.png)



\---



\# Features



\- Simple one-tap flight mechanics

\- Coin collection system

\- High score tracking

\- Multiple levels and worlds

\- Achievement and awards system

\- Mobile-friendly responsive design

\- Modern user interface

\- Browser-based gameplay



\---



\# Development Process



Feather Rush was developed using an AI-assisted development workflow.



The initial game structure and interface were generated using Vercel v0, which accelerated the creation of the user interface, application structure, and reusable components.



The project was then exported as a complete source-code project and further developed locally. Additional customization, testing, debugging, configuration, and deployment preparation were performed within a standard Next.js development environment.



This approach demonstrates how modern AI-assisted tools can be used alongside traditional software development practices to rapidly prototype and build interactive web applications.



\---



\# Technology Stack



\## Frontend



\- Next.js

\- React

\- TypeScript



\## Styling



\- Tailwind CSS

\- PostCSS



\## Package Management



\- PNPM



\## Development Environment



\- Node.js

\- Vercel v0

\- Visual Studio Code



\---



\# Architecture



The project follows a modern component-based architecture.



\### Application Layer



The application is organized using Next.js App Router and React components.



\### Components



Reusable UI elements are stored in the `components` directory, allowing consistent design and easier maintenance.



\### Game Logic



Core gameplay functionality includes:



\- Bird movement and flight mechanics

\- Collision detection

\- Score calculation

\- Coin collection

\- Level progression

\- Achievement tracking

\- Game state management



\### Assets



Static assets such as images and icons are stored within the `public` directory.



\---



\# Project Structure



```text

app/                Next.js application routes

components/         Reusable React components

lib/                Utility functions and game helpers

public/             Static assets



package.json        Project dependencies

next.config.mjs     Next.js configuration

tsconfig.json       TypeScript configuration

```



\---



\# Local Development



\## Prerequisites



Install:



\- Node.js

\- PNPM



Install PNPM globally:



```bash

npm install -g pnpm

```



\---



\## Running the Project



Clone the repository:



```bash

git clone https://github.com/YOUR\_USERNAME/feather-rush.git

```



Navigate to the project directory:



```bash

cd feather-rush

```



Install dependencies:



```bash

pnpm install

```



Start the development server:



```bash

pnpm dev

```



Open:



```text

http://localhost:3000

```



in your browser.



\---



\# Production Build



Build the project:



```bash

pnpm build

```



Start the production server:



```bash

pnpm start

```



\---



\# Future Enhancements



Potential future improvements include:



\- Additional worlds and environments

\- New character skins

\- Power-ups and special abilities

\- Sound effects and background music

\- Online leaderboards

\- Cloud save functionality

\- Daily challenges and rewards



\---



\# License



This project is provided for educational and portfolio purposes.



\---



\# Acknowledgements



\- Vercel v0 for AI-assisted interface generation

\- Next.js for the application framework

\- React for component-based UI development

\- TypeScript for type safety and maintainability

