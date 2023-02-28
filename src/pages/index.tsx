import { Tab } from "@headlessui/react";
import classNames from "classnames";
import { Cash, CreditCard } from "iconoir-react";
import { Fragment } from "react";
import { ChargesTable } from "~/components/ChargesTable";
import { PayoutsTable } from "~/components/PayoutsTable";

export default function Index() {
  return (
    <Tab.Group>
      <Tab.List className="-mb-px flex space-x-8 border-b border-gray-200">
        <Tab as={Fragment}>
          {({ selected }) => (
            <button
              className={classNames(
                "group inline-flex items-center border-b-2 py-4 px-2 text-sm font-medium",
                selected
                  ? "border-brand text-brand"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              )}
            >
              <CreditCard
                className={classNames(
                  selected
                    ? "text-brand"
                    : "text-gray-400 group-hover:text-gray-500",
                  "-ml-0.5 mr-2 h-5 w-5"
                )}
              />
              <span>Charges</span>
            </button>
          )}
        </Tab>
        <Tab as={Fragment}>
          {({ selected }) => (
            <button
              className={classNames(
                "group inline-flex items-center border-b-2 py-4 px-2 text-sm font-medium",
                selected
                  ? "border-brand text-brand"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              )}
            >
              <Cash
                className={classNames(
                  selected
                    ? "text-brand"
                    : "text-gray-400 group-hover:text-gray-500",
                  "-ml-0.5 mr-2 h-5 w-5"
                )}
              />
              <span>Payouts</span>
            </button>
          )}
        </Tab>
      </Tab.List>
      <Tab.Panels>
        <Tab.Panel>
          <ChargesTable />
        </Tab.Panel>
        <Tab.Panel>
          <PayoutsTable />
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  );
}
