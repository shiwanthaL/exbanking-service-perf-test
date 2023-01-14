import grpc from "k6/net/grpc";
import { sleep, check } from "k6";

const client = new grpc.Client();
client.load(["pb/proto/"], "banking-service.proto");

export const options = {
    // Configre less load distribution rampup period is 500ms gap between each hits (each 1s 2 user will hit the api) during 5sec
    // So, total hits 5s x 2 -> 10 hits  (2 hits per second)
    vus: 2,
    duration: "5s",
    thresholds: {
        //Evaluates whether 95 percent of responses happen within a certain duration
        grpc_req_duration: ['p(95)<100'], // 95% of requests should be below 10ms
    },
};

export default () => {
    // Connect with localhost:9090 grpc server
    client.connect("localhost:9090", {
        plaintext: true,
    });

    // Create request payload and invoke the protobuf servce and get the responce
    const req = { fullName: "Krashanth Josep" };
    const response = client.invoke("BankingService/get_balance", req);
    console.log(response.message);
    
    // Check that the response status is OK
    check(response, {
        "is status OK": (r) => r && r.status === grpc.StatusOK,
    });
    // Check that the response message is correct
    check(response.message, {
        "is correct customer fetch": (r) => r && r.fullName === "Krashanth Josep",
        "is correct account number fetch": (r) => r && r.accountNo === "5019-0865-5963-5013",
        "is correct account balance fetch": (r) => r && r.balance === "46065",
    });

    client.close();
    sleep(1);
};

export function handleSummary(data) {
    return {
      'report/summary.json': JSON.stringify(data), //the default data object
    };
}