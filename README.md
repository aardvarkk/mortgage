# Mortgage Switch Explorer

I wrote this tool because my mortgage broker told me I should pay the $10,000 penalty to break my mortgage a year before the term was over to take advantage of lower interest rates. It assumes all kinds of things that probably aren't true of your mortgage. The penalty cost calculation is the one that Scotiabank uses, so please don't assume this will just translate to whatever mortgage you use. The payment frequency is hard-coded to be weekly. And so on.

If you care enough to make this more extensible, please by all means contribute! Or go ahead and fork the code and do with it what you please!

**TL;DR**

Switching did not make sense. He had no idea what he was talking about and was a senior mortgage broker at a large firm.

![image](https://media.giphy.com/media/orUUilQpngYPGzarX5/giphy.gif?cid=790b761132dd254e279ec94b793637d62979535fbaa9025d&rid=giphy.gif&ct=g)

# Demo

[mortgage-switch-explorer.netlify.app](https://mortgage-switch-explorer.netlify.app/)

# Playing Around

* Drag the **Switch In Period** slider and watch how your **New** mortgage changes
* Mess with the interest rates to see how the **Gain** graph changes
* Notice the shape of the **Gain** graph. The discontinuity is because Scotiabank's penalty charges you a *minimum of three months' interest*, so as you approach the maturity it makes even less sense to break the mortgage.

# Terms

|Term|Meaning|
|-|-|
|**Start Date**|The date to start considering a switch|
|**Maturity**|The date the mortgage term is over|
|**Principal**|The outstanding balance of the mortgage as of the **Start Date**|
|**Current Interest Rate**|The annual interest rate currently being paid for the mortgage|
|**Comparison Interest Rate**|This is used for Scotiabank's penalty calculation. Details below| 
|**New Interest Rate**|The interest rate of the mortgage you are thinking of switching to|
|**Payment**|Your weekly payment on the mortgage|
|**Switch In Period**|Drag the slider to see how the numbers pan out if you switch in any week before maturity|
|**Total Payments**|The total of your weekly payments from the **Start Date** to **Maturity**|
|**Original**|A table showing the payment schedule of your existing mortgage|
|**New**|A table showing the payment schedule of the proposed mortgage, switching to the new interest rate on the week defined by **Switch In Period**|
|**Gain**|Is it worth it? You see a **Benefit** from paying down more of the mortgage, but is it greater than the **Penalty** for breaking the mortgage? How does it change depending on when you switch?|

## Comparison Interest Rate: Details

This value is used for the penalty calculation. My personal interpretation is "the posted interest rate for the remaining term of the mortgage minus the discount you received to get your existing mortgage rate". 

For example, if you have 1 year left on your mortgage, the posted 1 year fixed mortgage rate is 4%, and your current discount is 1.5% (you can find this on your mortgage statements), the Comparison Interest Rate would be 4% - 1.5% = 2.5%.

# Running

```
yarn
yarn start
# Open http://localhost:1234 in your browser
```
