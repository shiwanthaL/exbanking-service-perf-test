import grpc from "k6/net/grpc";
import { sleep } from "k6";

const client = new grpc.Client();
client.load(["pb/proto/"], "banking-service.proto");

export const options = {
    vus: 5,
    duration: "3s",
};

export default () => {
    client.connect("localhost:9090", {
        plaintext: true,
    });

    const req = { fullName: "Krashanth Josep" };
    const response = client.invoke("BankingService/get_balance", req);

    console.log(response.message);

    client.close();
    sleep(1);
};
