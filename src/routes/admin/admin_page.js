import { admin_page_html } from "./admin_page_html.js";

const unauthorized = `<span class="text-white text-2xl font-bold">Unauthorized Access :(</span>`;

const authorized = `<div id="a:w" class="flex gap-2 overflow-x-visible ">
    <div id="30d" class="bg-[#1A1A1A] py-2.5 w-[104px] flex justify-center rounded-md cursor-pointer">
      <span class="text-white leading-llg text-md font-semibold w-max">
        30 days
      </span>
    </div>
    <div id="7d" class="bg-[#1A1A1A] py-2.5 w-[104px] flex justify-center rounded-md cursor-pointer">
      <span class="text-white leading-llg text-md font-semibold w-max">
        7 days
      </span>
    </div>
    <div id="24h" class="bg-[#1A1A1A] py-2.5 w-[104px] flex justify-center rounded-md cursor-pointer">
      <span class="text-white leading-llg text-md font-semibold w-max">
        24 hours
      </span>
    </div>
    <div id="1h" class="bg-[#1A1A1A] py-2.5 w-[104px] flex justify-center rounded-md cursor-pointer">
      <span class="text-white leading-llg text-md font-semibold w-max">
        1 hour
      </span>
    </div>
</div>`;

export const admin_page = async (req, res) => {
  return res.send(admin_page_html(authorized));
};
