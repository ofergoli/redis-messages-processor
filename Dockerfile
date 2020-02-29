FROM node:12.14.1

COPY . /app/
WORKDIR /app/

RUN npm install
EXPOSE 3000

CMD ["npm", "start"]
