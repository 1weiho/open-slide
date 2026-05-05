FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 5173

ENV OPEN_SLIDE_SKIP_SKILLS_CHECK=1

CMD ["npx", "open-slide", "dev", "--host", "0.0.0.0", "--no-skills-check"]
