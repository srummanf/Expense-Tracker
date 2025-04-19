import React from "react";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { Link } from "react-scroll";

const NavigationButtons = () => {
  const components = [
    { id: "calendar", name: "Calendar View" },
    { id: "netWorthTimeline", name: "Net Worth Timeline" },
    { id: "expenseForecast", name: "Expense Forecast" },
    { id: "monthlyCalendar", name: "Monthly Calendar" },
    { id: "weeklyTrends", name: "Weekly Trends" },
    { id: "cashflowWaterfall", name: "Cash Flow Waterfall" },
    { id: "recurringTransactions", name: "Recurring Transactions" },
    { id: "budgetIndicator", name: "Budget Indicator" },
    { id: "spendingBreakdown", name: "Spending Breakdown" },
    { id: "expenseAnalysis", name: "Expense Analysis" },
    { id: "savingGoalTracker", name: "Savings Goal Tracker" },
    { id: "FinancialHealthScore", name: "Financial Health Score" },
    { id: "BillReminders", name: "Bill Reminders" },
    { id: "InvestmentPortfolioTracker", name: "Investment Portfolio Tracker" },
    { id: "ExpenseToIncomeRatioTracker", name: "Expense To Income Ratio Tracker" },
    { id: "DiscretionarySpendingAnalysis", name: "Discretionary Spending Analysis" },
    // { id: "SavingsOpportunityFinder", name: "Savings Opportunity Finder" },
    { id: "financialChart", name: "Financial Chart" },
    { id: "transactionList", name: "Transaction List" },
  ];

  return (
    <div className="my-9">
      <ScrollArea.Root className="w-full overflow-hidden">
        <ScrollArea.Viewport className="w-full h-full">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {components.map((component) => (
              <Link
                key={component.id}
                to={component.id}
                spy={true}
                smooth={true}
                offset={-100}
                duration={500}
                className="block"
              >
                <button
                  className="w-full bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 
                            text-gray-700 font-medium py-3 px-4 rounded-lg shadow-sm transition-all duration-200
                            hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {component.name}
                </button>
              </Link>
            ))}
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          className="flex select-none touch-none p-0.5 bg-gray-100 transition-colors duration-150 ease-out hover:bg-gray-200 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
          orientation="horizontal"
        >
          <ScrollArea.Thumb className="flex-1 bg-gray-400 rounded-lg relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    </div>
  );
};

export default NavigationButtons;