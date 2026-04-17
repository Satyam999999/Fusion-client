import PropTypes from "prop-types";
import { ArrowsDownUp, ArrowUp, ArrowDown } from "@phosphor-icons/react";

export function SortTh({ label, col, sortColumn, sortDirection, onSort }) {
  return (
    <th onClick={() => onSort(col)}
      style={{ fontWeight:600, textAlign:"center", cursor:"pointer",
                fontSize:"0.9rem", padding:"10px 8px", userSelect:"none" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
        {label}
        {sortColumn === col
          ? sortDirection === "asc"
            ? <ArrowUp size={14} />
            : <ArrowDown size={14} />
          : <ArrowsDownUp size={14} />}
      </div>
    </th>
  );
}
SortTh.propTypes = {
  label: PropTypes.string.isRequired,
  col: PropTypes.string.isRequired,
  sortColumn: PropTypes.string,
  sortDirection: PropTypes.string,
  onSort: PropTypes.func.isRequired,
};

export function useSortState() {
  const [sortColumn, setSortColumn] = React.useState(null);
  const [sortDirection, setSortDirection] = React.useState("asc");
  const handleSort = (col) => {
    if (sortColumn === col) setSortDirection(d => d === "asc" ? "desc" : "asc");
    else { setSortColumn(col); setSortDirection("asc"); }
  };
  const sortData = (data) => {
    if (!sortColumn) return data;
    return [...data].sort((a, b) => {
      const av = typeof a[sortColumn] === "string" ? a[sortColumn].toLowerCase() : a[sortColumn];
      const bv = typeof b[sortColumn] === "string" ? b[sortColumn].toLowerCase() : b[sortColumn];
      if (av == null) return 1; if (bv == null) return -1;
      if (av < bv) return sortDirection === "asc" ? -1 : 1;
      if (av > bv) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };
  return { sortColumn, sortDirection, handleSort, sortData };
}
