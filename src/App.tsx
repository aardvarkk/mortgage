import React, { FC, useEffect, useState } from "react";
import { DateTime } from "luxon";
import currency from "currency.js";
import { Line } from "react-chartjs-2";
import { ChartData } from "chart.js";

const MARGIN = 8;

type Schedule = Array<{
  date: DateTime;
  initial: number;
  payment: number;
  rate: number;
  interestPayment: number;
  principalPayment: number;
  remaining: number;
}>;

type ScheduleSumField = "payment" | "interestPayment" | "principalPayment";

function calcPaymentsToMaturity(start: DateTime, maturity: DateTime): number {
  return Math.ceil(maturity.diff(start, "weeks").weeks);
}

function calcSchedule(
  start: DateTime,
  principal: number,
  maturity: DateTime,
  interest: number,
  payment: number,
  switchPeriod?: number,
  newInterest?: number
): Schedule {
  let schedule = [];
  let date = start;
  let remaining = principal;
  const paymentsToMaturity = calcPaymentsToMaturity(start, maturity);
  for (let i = 0; i < paymentsToMaturity; ++i) {
    const rate =
      switchPeriod !== undefined && i >= switchPeriod ? newInterest! : interest;
    const interestPayment = (remaining * rate) / 100 / 52;
    const principalPayment = payment - interestPayment;
    const nextRemaining = remaining - principalPayment;
    schedule.push({
      date,
      initial: remaining,
      payment,
      rate,
      interestPayment,
      principalPayment,
      remaining: nextRemaining,
    });
    date = date.plus({ weeks: 1 });
    remaining = nextRemaining;
  }
  return schedule;
}

function scheduleSum(schedule: Schedule, field: ScheduleSumField) {
  return schedule.map((p) => p[field]).reduce((p, s) => s + p, 0);
}

function calcSwitchPenalty(
  origSchedule: Schedule,
  comparisonSchedule: Schedule,
  threeMonths: Schedule,
  switchPeriod: number
): number {
  const val1 = scheduleSum(origSchedule.slice(switchPeriod), "interestPayment");
  const val2 = scheduleSum(
    comparisonSchedule.slice(switchPeriod),
    "interestPayment"
  );
  const threeMonthsInterest = scheduleSum(threeMonths, "interestPayment");
  return -Math.max(val1 - val2, threeMonthsInterest);
}

function calcGain(
  scheduleA: Schedule,
  scheduleB: Schedule,
  switchPenalty: number
) {
  const remainingA = scheduleA[scheduleA.length - 1].remaining;
  const remainingB = scheduleB[scheduleB.length - 1].remaining;
  return remainingA - remainingB + switchPenalty;
}

const ScheduleTable: FC<{ schedule: Schedule; switchPeriod?: number }> = ({
  schedule,
  switchPeriod,
}) => {
  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Initial</th>
            <th>Payment</th>
            <th>Rate</th>
            <th>Interest</th>
            <th>Principal</th>
            <th>Remaining</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((week, idx) => (
            <tr
              key={week.date.toISODate()}
              style={{
                backgroundColor:
                  idx === switchPeriod ? "aquamarine" : "inherit",
              }}
            >
              <td>{week.date.toISODate()}</td>
              <td>
                <Currency val={week.initial} />
              </td>
              <td>
                <Currency val={week.payment} />
              </td>
              <td>{week.rate}%</td>
              <td>
                <Currency val={week.interestPayment} />
              </td>
              <td>
                <Currency val={week.principalPayment} />
              </td>
              <td>
                <Currency val={week.remaining} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Currency: FC<{ val: number; opts?: any }> = ({ val, opts }) => {
  return (
    <span style={{ fontFamily: "monospace" }}>
      {currency(val, opts).format()}
    </span>
  );
};

const App: FC = () => {
  const [start, setStart] = useState(DateTime.now());
  const [principal, setPrincial] = useState(500000);
  const [maturity, setMaturity] = useState(DateTime.now().plus({ months: 13 }));
  const [interest, setInterest] = useState(3.2);
  const [comparisonInterest, setComparisonInterest] = useState(1.1);
  const [newInterest, setNewInterest] = useState(1.9);
  const [payment, setPayment] = useState(500);
  const [switchPeriod, setSwitchPeriod] = useState(0);

  const paymentsToMaturity = calcPaymentsToMaturity(start, maturity);

  const origSchedule = calcSchedule(
    start,
    principal,
    maturity,
    interest,
    payment
  );

  const threeMonths = calcSchedule(
    start,
    principal,
    start.plus({ months: 3 }),
    interest,
    payment
  );

  const comparisonSchedule = calcSchedule(
    start,
    principal,
    maturity,
    interest,
    payment,
    switchPeriod,
    comparisonInterest
  );

  const newSchedule = calcSchedule(
    start,
    principal,
    maturity,
    interest,
    payment,
    switchPeriod,
    newInterest
  );

  const switchPenalty = calcSwitchPenalty(
    origSchedule,
    comparisonSchedule,
    threeMonths,
    switchPeriod
  );

  const totalPayments = scheduleSum(origSchedule, "payment");

  const origTotalInterest = scheduleSum(origSchedule, "interestPayment");
  const origTotalPrincipal = scheduleSum(origSchedule, "principalPayment");
  const origRemaining = origSchedule[origSchedule.length - 1].remaining;
  const newTotalInterest = scheduleSum(newSchedule, "interestPayment");
  const newTotalPrincipal = scheduleSum(newSchedule, "principalPayment");
  const newRemaining = newSchedule[newSchedule.length - 1].remaining;

  const [chartData, setChartData] = useState<ChartData>({} as ChartData);

  function getChartData() {
    let gains: number[] = [];
    for (let i = 0; i < paymentsToMaturity; ++i) {
      const thisNewSchedule = calcSchedule(
        start,
        principal,
        maturity,
        interest,
        payment,
        i,
        newInterest
      );
      const thisComparisonSchedule = calcSchedule(
        start,
        principal,
        maturity,
        interest,
        payment,
        i,
        comparisonInterest
      );
      const thisSwitchPenalty = calcSwitchPenalty(
        origSchedule,
        thisComparisonSchedule,
        threeMonths,
        i
      );
      gains.push(calcGain(origSchedule, thisNewSchedule, thisSwitchPenalty));
    }

    return {
      labels: origSchedule.map((s) => s.date.toISODate()),
      datasets: [
        {
          label: "Gain",
          data: gains,
          backgroundColor: "crimson",
          borderColor: "crimson",
        },
      ],
    };
  }

  useEffect(
    () => setChartData(getChartData()),
    [
      start,
      principal,
      maturity,
      interest,
      comparisonInterest,
      newInterest,
      payment,
    ]
  );

  return (
    <>
      <div
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "space-around",
        }}
      >
        <table>
          <tbody>
            <tr>
              <td>
                <label htmlFor="date">Start Date</label>
              </td>
              <td>
                <input
                  type="date"
                  id="date"
                  value={start.toISODate()}
                  onChange={(e) => setStart(DateTime.fromISO(e.target.value))}
                />
              </td>
            </tr>
            <tr>
              <td>
                <label htmlFor="maturity">Maturity</label>
              </td>
              <td>
                <input
                  type="date"
                  id="maturity"
                  value={maturity.toISODate()}
                  onChange={(e) =>
                    setMaturity(DateTime.fromISO(e.target.value))
                  }
                />
              </td>
            </tr>
            <tr>
              <td>
                <label htmlFor="principal">Principal</label>
              </td>
              <td>
                <input
                  type="number"
                  id="principal"
                  value={principal}
                  onChange={(e) => setPrincial(parseFloat(e.target.value))}
                />
              </td>
            </tr>
            <tr>
              <td>
                <label htmlFor="interest">Current Interest Rate (%)</label>
              </td>
              <td>
                <input
                  type="number"
                  id="interest"
                  step="0.05"
                  value={interest}
                  onChange={(e) => setInterest(parseFloat(e.target.value))}
                />
              </td>
            </tr>
            <tr>
              <td>
                <label htmlFor="comparisoninterest">
                  Comparison Interest Rate (%)
                </label>
              </td>
              <td>
                <input
                  type="number"
                  id="comparisonInterest"
                  step="0.05"
                  value={comparisonInterest}
                  onChange={(e) =>
                    setComparisonInterest(parseFloat(e.target.value))
                  }
                />
              </td>
            </tr>
            <tr>
              <td>
                <label htmlFor="newInterest">New Interest Rate (%)</label>
              </td>
              <td>
                <input
                  type="number"
                  id="newInterest"
                  step="0.05"
                  value={newInterest}
                  onChange={(e) => setNewInterest(parseFloat(e.target.value))}
                />
              </td>
            </tr>
            <tr>
              <td>
                <label htmlFor="payment">Payment</label>
              </td>
              <td>
                <input
                  type="number"
                  id="payment"
                  value={payment}
                  onChange={(e) => setPayment(parseFloat(e.target.value))}
                />
              </td>
            </tr>
            {/* <tr>
        <td>Periods to Maturity</td>
        <td>{paymentsToMaturity}</td>
      </tr> */}
            <tr>
              <td>
                <label htmlFor="switchPeriod">Switch In Period</label>
              </td>
              <td style={{ display: "flex", alignItems: "center" }}>
                <input
                  type="range"
                  min={0}
                  max={paymentsToMaturity - 1}
                  value={switchPeriod}
                  onChange={(e) =>
                    setSwitchPeriod(parseInt(e.target.value, 10))
                  }
                />
                <div style={{ marginLeft: MARGIN }}>
                  {origSchedule[switchPeriod].date.toISODate()}
                </div>
              </td>
            </tr>
            <tr>
              <td>Total Payments</td>
              <td>
                <Currency val={totalPayments} />
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div>
            <h1>Gain</h1>
            <table>
              <tbody>
                <tr>
                  <td>Benefit (Additional Paydown)</td>
                  <td>
                    <Currency
                      val={origRemaining - newRemaining}
                      opts={{ pattern: "+!#" }}
                    />
                  </td>
                </tr>
                <tr>
                  <td>Cost (Penalty)</td>
                  <td>
                    <Currency val={switchPenalty} />
                  </td>
                </tr>
                <tr>
                  <td>Total</td>
                  <td>
                    <Currency
                      val={calcGain(origSchedule, newSchedule, switchPenalty)}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ width: 500 }}>
            <Line
              data={chartData}
              options={{
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (context) =>
                        currency(context.formattedValue).format(),
                    },
                  },
                },
                scales: {
                  y: {
                    suggestedMax: 0,
                    ticks: { callback: (value) => currency(value).format() },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      <div
        id="comparison"
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "space-around",
        }}
      >
        <div id="original">
          <div>
            <h1>Original</h1>
            <table>
              <tbody>
                <tr>
                  <td>Total Interest</td>
                  <td>
                    <Currency val={origTotalInterest} />
                  </td>
                </tr>
                <tr>
                  <td>Total Principal</td>
                  <td>
                    <Currency val={origTotalPrincipal} />
                  </td>
                </tr>
                <tr>
                  <td>Remaining at Maturity</td>
                  <td>
                    <Currency val={origRemaining} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <ScheduleTable schedule={origSchedule} />
        </div>
        <div id="new">
          <div>
            <h1>New</h1>
            <table>
              <tbody>
                <tr>
                  <td>Total Interest</td>
                  <td>
                    <Currency val={newTotalInterest} />
                  </td>
                </tr>
                <tr>
                  <td>Total Principal</td>
                  <td>
                    <Currency val={newTotalPrincipal} />
                  </td>
                </tr>
                <tr>
                  <td>Remaining at Maturity</td>
                  <td>
                    <Currency val={newRemaining} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <ScheduleTable schedule={newSchedule} switchPeriod={switchPeriod} />
        </div>
      </div>
    </>
  );
};

export default App;
