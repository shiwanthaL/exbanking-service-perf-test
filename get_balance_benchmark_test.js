import grpc from "k6/net/grpc";
import { sleep, check } from "k6";
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

const client = new grpc.Client();
client.load(["pb/proto/"], "banking-service.proto");

const host = "localhost:9090";
const user = {
    fullName: "Krashanth Josep",
    email: "Krashanth@gmail.com",
    passport: "N82292"
};
const api_create_user = "BankingService/create_user";
const api_close_account = "BankingService/close_account";
const api_get_balance = "BankingService/get_balance";

export const options = {
    // Configure less load distribution for benchmark, ramp period is 500ms gap between each hits (each 1s 2 user will hit the api) during 5sec
    // So, total execution time duration 25s and 1st 5s will release 2 vue uses and next 15s will release 5 vue uses to maintain consistency, after that execution will terminate within next 5s
    stages: [
        { target: 15, duration: '5s' }, //Accelerate stage (outliers)
        { target: 15, duration: '15s' }, //Cool stage
        { target: 0, duration: '5s' }, //Termination Stage (outliers)
    ],
    thresholds: {
        //Evaluates whether 95 percent of responses happen within a certain duration
        grpc_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms - threshold
    },
};

// setting up the connection and create a user
export function setup() {
    connectTo(host)
    createUser(user);
    console.log("========= Initiate New VUE User ========");
    console.log("========================================");
}

// cleanup and teardown
export function teardown(data) {
    connectTo(host);
    closeAccount(user.fullName)
    console.log("===== Complete existing User Flow =====");
    console.log("========================================");
}

/**
 * @Testcase : Under minimum load conditions validate bank user will be able to receive account balance within 50ms with valida details.
 * Purpose: BankingService/get_balance gRPC endpoint benchmark load test
 * Checkpoints as follows
 *  - Response status should always = StatusOK
 *  - Response should include correct user details
 *        - full_name , account , amount
 *
 *  - 95% population (normal distribution 95 percentile) server response should below 500ms time slot
 *
 *  Limitation: since this is sample project always same user details will access server to hit the request, and ram-up period
 *  also not that much realistic since very short time execution for demo purpose.
 */
export default () => {

    // Connect with localhost:9090 exbanking grpc server
    connectTo(host);

    // Create request payload and invoke the protobuf service and get the response
    const req = { fullName: user.fullName };
    const response = client.invoke(api_get_balance, req);
    console.log(response.message);

    check(response, {
        "is status OK": (r) => r && r.status === grpc.StatusOK, // Status is OK (Passed Scenario - Checkpoint)
    });

    // Check that the response message is correct
    check(response.message, {
        "is correct customer fetch": (r) => r && r.fullName === user.fullName, // (Passed Scenario - Checkpoint)
        "is correct account number fetch": (r) => r && r.accountNo === "5019-0865-5963-5013", // (Intentionally Fail Scenario - Checkpoint)
        "is correct account balance fetch": (r) => r && r.balance === "46065", // (Intentionally Fail Scenario - Checkpoint)
    });

    client.close();
    sleep(1);
};

// generate summary json
export function handleSummary(data) {
    return {
        'stdout': textSummary(data, { indent: ' ', enableColors: true }),
        'YOLOReport/summary.json': JSON.stringify(data)
    };
}

// create connection to the host
export function connectTo(host) {
    client.connect(host, {
        plaintext: true,
    });
}

// create a user by invoking grpc create_user
export function createUser(userObj) {
    console.log(`create_user: ${JSON.stringify(userObj)}`)
    const response = client.invoke(api_create_user, userObj);
    console.log(`create_user_response: ${JSON.stringify(response.message)}`)
}

// close given user account
export function closeAccount(userName) {
    const req = { fullName: userName }
    console.log(`close_account: ${JSON.stringify(userName)}`)
    const response = client.invoke(api_close_account, req);
    console.log(`close_account_response: ${JSON.stringify(response.message)}`)
}