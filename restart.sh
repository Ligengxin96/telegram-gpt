docker stop telegram-gpt && docker rm telegram-gpt
docker run -v /etc/localtime:/etc/localtime --name telegram-gpt -d telegram-gpt-image