import dbConnect from "./mongodb";
import Table from "../models/Table";
import Row from "../models/Row";

export const DEFAULT_COLUMNS = [
  {
    id: "leadId",
    name: "Lead ID",
    type: "text",
    options: [],
    special: "normal",
  },
  {
    id: "name",
    name: "Name",
    type: "text",
    options: [],
    special: "normal",
  },
  {
    id: "project",
    name: "Project",
    type: "text",
    options: [],
    special: "normal",
  },
  {
    id: "phone",
    name: "Phone",
    type: "phone",
    options: [],
    special: "normal",
  },
  {
    id: "contactDateTime",
    name: "Contact Date/Time",
    type: "datetime",
    options: [],
    special: "normal",
  },
  {
    id: "status",
    name: "Status",
    type: "dropdown",
    options: [
      "New",
      "Not Received",
      "Not Interested",
      "Call Cut",
      "Interested",
      "Follow-up",
      "Converted",
    ],
    special: "status",
  },
  {
    id: "remarks",
    name: "Remarks",
    type: "longText",
    options: [],
    special: "normal",
  },
  {
    id: "followupDate",
    name: "Follow-up Date",
    type: "date",
    options: [],
    special: "followup",
  },
  {
    id: "priority",
    name: "Priority",
    type: "dropdown",
    options: ["High", "Medium", "Low"],
    special: "priority",
  },
];

export function formatDateOffset(daysOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateTimeOffset(daysOffset = 0, hours = 10, minutes = 30) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hours, minutes, 0, 0);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hh}:${mm}`;
}

export async function getOrSeedDefaultTable() {
  await dbConnect();
  let table = await Table.findOne();

  if (!table) {
    table = await Table.create({
      name: "Lead Management",
      columns: DEFAULT_COLUMNS,
    });

    const sampleRows = [
      {
        tableId: table._id,
        data: {
          leadId: "EN-312585",
          name: "Rajesh Sharma",
          project: "M3M The Cullinan Avenue",
          phone: "+91 98765 43210",
          contactDateTime: formatDateTimeOffset(-2, 11, 0),
          status: "Follow-up",
          remarks: "Interested in 3BHK unit. Requested site visit details.",
          followupDate: formatDateOffset(0), // Today
          priority: "High",
        },
      },
      {
        tableId: table._id,
        data: {
          leadId: "EN-312586",
          name: "Ananya Gupta",
          project: "JEWEL CREST AVENUE",
          phone: "+91 98112 23344",
          contactDateTime: formatDateTimeOffset(-5, 14, 30),
          status: "New",
          remarks: "Site visit missed, needs rescheduled call.",
          followupDate: formatDateOffset(-4), // Overdue
          priority: "High",
        },
      },
      {
        tableId: table._id,
        data: {
          leadId: "EN-312587",
          name: "Vikram Malhotra",
          project: "Godrej Meridien",
          phone: "+91 99001 12233",
          contactDateTime: formatDateTimeOffset(-1, 16, 0),
          status: "Interested",
          remarks: "Discussing payment plans and inventory options.",
          followupDate: formatDateOffset(1), // Tomorrow
          priority: "Medium",
        },
      },
      {
        tableId: table._id,
        data: {
          leadId: "EN-312588",
          name: "Pooja Verma",
          project: "DLF The Camellias",
          phone: "+91 97654 32109",
          contactDateTime: formatDateTimeOffset(-3, 10, 15),
          status: "Follow-up",
          remarks: "Requested brochure and floor plan PDFs on WhatsApp.",
          followupDate: formatDateOffset(6), // Upcoming
          priority: "Low",
        },
      },
      {
        tableId: table._id,
        data: {
          leadId: "EN-312589",
          name: "Suresh Iyer",
          project: "M3M The Cullinan Avenue",
          phone: "+91 98220 55443",
          contactDateTime: formatDateTimeOffset(0, 9, 45),
          status: "Converted",
          remarks: "Booking amount received. Agreement in progress.",
          followupDate: "", // No Date
          priority: "Medium",
        },
      },
      {
        tableId: table._id,
        data: {
          leadId: "EN-312590",
          name: "Kavita Reddy",
          project: "JEWEL CREST AVENUE",
          phone: "+91 99887 76655",
          contactDateTime: formatDateTimeOffset(-6, 15, 0),
          status: "Call Cut",
          remarks: "Busy at the moment, requested call back later.",
          followupDate: formatDateOffset(0), // Today
          priority: "Medium",
        },
      },
    ];

    await Row.insertMany(sampleRows);
  }

  return table;
}
