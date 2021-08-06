# SumViet API

## Instruction to run

1. Clone project
2. Change directory the project folder
3. Make a copy of file .env-template and rename the copy to .env
4. Run command: `npm install`
5. Run command: `npm start`
6. Go to `localhost:3000`.

Have fun!

## Installing Elasticsearch using Docker

See [Sum Viet Search Repository](https://gitlab.com/codosaholding/sumviet-search)

## Installing Chat using Docker

See [Sum Viet Chat Repository](https://gitlab.com/codosaholding/sumviet-chat)

## Installing Elasticsearch

```
sudo apt update && sudo apt install openjdk-8-jdk
```

> install java if not installed

```
wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
```

```
echo "deb https://artifacts.elastic.co/packages/7.x/apt stable main" | sudo tee -a /etc/apt/sources.list.d/elastic-7.x.list
```

```
sudo apt update && sudo apt install elasticsearch
```

```
sudo systemctl daemon-reload
sudo systemctl enable elasticsearch.service

```

> install plugin

```
bin/elasticsearch-plugin install analysis-icu
```
