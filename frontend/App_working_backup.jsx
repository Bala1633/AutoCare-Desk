import { useEffect, useState } from "react";
import "./App.css";

const API = "http://127.0.0.1:5000";

function App() {
  const [email, setEmail] = useState(
    "advisor@autocare.com"
  );

  const [password, setPassword] = useState(
    "123456"
  );

  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [message, setMessage] = useState("");

  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);

  const [serviceHistory, setServiceHistory] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);

  const [managerSummary, setManagerSummary] = useState(null);

  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [workItems, setWorkItems] = useState([]);
  const [parts, setParts] = useState([]);

  const [historySearch, setHistorySearch] = useState("");

  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const [vehicleForm, setVehicleForm] = useState({
    customer_id: "",
    vin: "",
    make: "",
    model: "",
    year: "",
    vehicle_type: "",
  });

  const [appointmentForm, setAppointmentForm] = useState({
    customer_id: "",
    vehicle_id: "",
    appointment_date: "",
    service_type: "",
    status: "Scheduled",
  });

  const [workOrderForm, setWorkOrderForm] = useState({
    vehicle_id: "",
    mechanic_id: "",
    issue_description: "",
    status: "Open",
  });

  const [checklistForm, setChecklistForm] = useState({
    item_name: "",
    notes: "",
  });

  const [partForm, setPartForm] = useState({
    part_name: "",
    quantity: 1,
    price: 0,
  });

  const [vinLoading, setVinLoading] = useState(false);


  // ======================================================
  // LOGIN
  // ======================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("");

    try {
      const response = await fetch(
        `${API}/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setPage("dashboard");
      } else {
        setMessage(data.error);
      }

    } catch {
      setMessage(
        "Cannot connect to backend"
      );
    }
  };


  const logout = () => {
    setUser(null);
    setPage("dashboard");
    setMessage("");
    setSelectedWorkOrder(null);
    setSelectedHistory(null);
  };


  // ======================================================
  // FETCH
  // ======================================================

  const fetchCustomers = async () => {
    const response = await fetch(
      `${API}/customers`
    );

    const data = await response.json();

    if (response.ok) {
      setCustomers(data);
    }
  };


  const fetchVehicles = async () => {
    const response = await fetch(
      `${API}/vehicles`
    );

    const data = await response.json();

    if (response.ok) {
      setVehicles(data);
    }
  };


  const fetchAppointments = async () => {
    const response = await fetch(
      `${API}/appointments`
    );

    const data = await response.json();

    if (response.ok) {
      setAppointments(data);
    }
  };


  const fetchMechanics = async () => {
    const response = await fetch(
      `${API}/mechanics`
    );

    const data = await response.json();

    if (response.ok) {
      setMechanics(data);
    }
  };


  const fetchWorkOrders = async () => {
    let url = `${API}/work-orders`;

    if (user?.role === "Mechanic") {
      url += `?mechanic_id=${user.id}`;
    }

    const response = await fetch(url);

    const data = await response.json();

    if (response.ok) {
      setWorkOrders(data);
    }
  };


  const fetchServiceHistory = async () => {
    const response = await fetch(
      `${API}/service-history`
    );

    const data = await response.json();

    if (response.ok) {
      setServiceHistory(data);
    }
  };


  const fetchManagerSummary = async () => {
    const response = await fetch(
      `${API}/manager-summary`
    );

    const data = await response.json();

    if (response.ok) {
      setManagerSummary(data);
    }
  };


  const fetchJobDetails = async (id) => {
    const orderResponse = await fetch(
      `${API}/work-orders/${id}`
    );

    const orderData =
      await orderResponse.json();

    if (orderResponse.ok) {
      setSelectedWorkOrder(orderData);
    }

    const itemResponse = await fetch(
      `${API}/work-orders/${id}/items`
    );

    const itemData =
      await itemResponse.json();

    if (itemResponse.ok) {
      setWorkItems(itemData);
    }

    const partResponse = await fetch(
      `${API}/work-orders/${id}/parts`
    );

    const partData =
      await partResponse.json();

    if (partResponse.ok) {
      setParts(partData);
    }
  };


  const openHistoryDetail = async (id) => {
    const response = await fetch(
      `${API}/service-history/${id}`
    );

    const data = await response.json();

    if (response.ok) {
      setSelectedHistory(data);
      setPage("history-detail");
    } else {
      setMessage(data.error);
    }
  };


  // ======================================================
  // CUSTOMER
  // ======================================================

  const saveCustomer = async (e) => {
    e.preventDefault();

    const response = await fetch(
      `${API}/customers`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(
          customerForm
        ),
      }
    );

    const data =
      await response.json();

    if (response.ok) {
      setMessage(
        "Customer added successfully"
      );

      setCustomerForm({
        name: "",
        phone: "",
        email: "",
        address: "",
      });

      fetchCustomers();
    } else {
      setMessage(data.error);
    }
  };


  // ======================================================
  // VEHICLE
  // ======================================================

  const lookupVIN = async () => {
    const vin =
      vehicleForm.vin
        .trim()
        .toUpperCase();

    if (vin.length !== 17) {
      setMessage(
        "VIN must contain 17 characters"
      );

      return;
    }

    setVinLoading(true);

    const response = await fetch(
      `${API}/vin/${vin}`
    );

    const data =
      await response.json();

    if (response.ok) {
      setVehicleForm({
        ...vehicleForm,
        vin: data.vin,
        make: data.make || "",
        model: data.model || "",
        year: data.year || "",
        vehicle_type:
          data.vehicle_type || "",
      });

      setMessage(
        "VIN decoded successfully"
      );
    } else {
      setMessage(data.error);
    }

    setVinLoading(false);
  };


  const saveVehicle = async (e) => {
    e.preventDefault();

    const response = await fetch(
      `${API}/vehicles`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(
          vehicleForm
        ),
      }
    );

    const data =
      await response.json();

    if (response.ok) {
      setMessage(
        "Vehicle registered successfully"
      );

      setVehicleForm({
        customer_id: "",
        vin: "",
        make: "",
        model: "",
        year: "",
        vehicle_type: "",
      });

      fetchVehicles();
    } else {
      setMessage(data.error);
    }
  };


  // ======================================================
  // APPOINTMENT
  // ======================================================

  const saveAppointment = async (e) => {
    e.preventDefault();

    const response = await fetch(
      `${API}/appointments`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(
          appointmentForm
        ),
      }
    );

    const data =
      await response.json();

    if (response.ok) {
      setMessage(
        "Appointment created successfully"
      );

      setAppointmentForm({
        customer_id: "",
        vehicle_id: "",
        appointment_date: "",
        service_type: "",
        status: "Scheduled",
      });

      fetchAppointments();
    } else {
      setMessage(data.error);
    }
  };


  const updateAppointmentStatus =
    async (id, status) => {
      const response = await fetch(
        `${API}/appointments/${id}/status`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            status,
          }),
        }
      );

      const data =
        await response.json();

      setMessage(
        response.ok
          ? "Appointment status updated"
          : data.error
      );

      if (response.ok) {
        fetchAppointments();
      }
    };


  // ======================================================
  // WORK ORDERS
  // ======================================================

  const saveWorkOrder = async (e) => {
    e.preventDefault();

    const response = await fetch(
      `${API}/work-orders`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(
          workOrderForm
        ),
      }
    );

    const data =
      await response.json();

    if (response.ok) {
      setMessage(
        "Work order created successfully"
      );

      setWorkOrderForm({
        vehicle_id: "",
        mechanic_id: "",
        issue_description: "",
        status: "Open",
      });

      fetchWorkOrders();
    } else {
      setMessage(data.error);
    }
  };


  const updateWorkOrderStatus =
    async (id, status) => {
      const response = await fetch(
        `${API}/work-orders/${id}/status`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            status,
          }),
        }
      );

      const data =
        await response.json();

      setMessage(
        response.ok
          ? "Work order status updated"
          : data.error
      );

      if (response.ok) {
        fetchWorkOrders();

        if (
          selectedWorkOrder?.id === id
        ) {
          fetchJobDetails(id);
        }

        fetchServiceHistory();
      }
    };


  // ======================================================
  // CHECKLIST
  // ======================================================

  const addChecklistItem =
    async (e) => {
      e.preventDefault();

      const response = await fetch(
        `${API}/work-orders/${selectedWorkOrder.id}/items`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            checklistForm
          ),
        }
      );

      const data =
        await response.json();

      if (response.ok) {
        setChecklistForm({
          item_name: "",
          notes: "",
        });

        setMessage(
          "Checklist item added"
        );

        fetchJobDetails(
          selectedWorkOrder.id
        );
      } else {
        setMessage(data.error);
      }
    };


  const toggleChecklistItem =
    async (item) => {
      await fetch(
        `${API}/work-items/${item.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            item_name:
              item.item_name,

            notes:
              item.notes,

            completed:
              !item.completed,
          }),
        }
      );

      fetchJobDetails(
        selectedWorkOrder.id
      );
    };


  const updateChecklistNotes =
    async (item, notes) => {
      await fetch(
        `${API}/work-items/${item.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            item_name:
              item.item_name,

            completed:
              item.completed,

            notes,
          }),
        }
      );
    };


  // ======================================================
  // PARTS
  // ======================================================

  const addPart = async (e) => {
    e.preventDefault();

    const response = await fetch(
      `${API}/work-orders/${selectedWorkOrder.id}/parts`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(
          partForm
        ),
      }
    );

    const data =
      await response.json();

    if (response.ok) {
      setPartForm({
        part_name: "",
        quantity: 1,
        price: 0,
      });

      setMessage(
        "Part added successfully"
      );

      fetchJobDetails(
        selectedWorkOrder.id
      );
    } else {
      setMessage(data.error);
    }
  };


  // ======================================================
  // PAGE LOAD
  // ======================================================

  useEffect(() => {
    if (!user) return;

    if (page === "customers") {
      fetchCustomers();
    }

    if (page === "vehicles") {
      fetchCustomers();
      fetchVehicles();
    }

    if (page === "appointments") {
      fetchCustomers();
      fetchVehicles();
      fetchAppointments();
    }

    if (page === "workorders") {
      fetchVehicles();
      fetchMechanics();
      fetchWorkOrders();
    }

    if (page === "mechanic-jobs") {
      fetchWorkOrders();
    }

    if (page === "service-history") {
      fetchServiceHistory();
    }

    if (
      page === "dashboard" &&
      user.role === "Manager"
    ) {
      fetchManagerSummary();
    }

  }, [page, user]);


  // ======================================================
  // LOGIN PAGE
  // ======================================================

  if (!user) {
    return (
      <div className="login-page">

        <div className="login-card">

          <h1>
            AutoCare Desk
          </h1>

          <p>
            Vehicle Service Center CRM
          </p>

          <form
            onSubmit={handleLogin}
          >

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              required
            />

            <button type="submit">
              Login
            </button>

          </form>

          {message && (
            <p className="status-message">
              {message}
            </p>
          )}

        </div>

      </div>
    );
  }


  // ======================================================
  // HISTORY DETAIL
  // ======================================================

  if (
    page === "history-detail" &&
    selectedHistory
  ) {
    return (
      <ManagementShell
        user={user}
        logout={logout}
        title={`Service Record #${selectedHistory.id}`}
        description={`${selectedHistory.vehicle_name} — ${selectedHistory.vin}`}
        back={() => {
          setPage("service-history");
          setSelectedHistory(null);
        }}
        message={message}
      >

        <div className="history-summary">

          <HistoryBox
            title="Customer"
            value={
              selectedHistory.customer_name
            }
          />

          <HistoryBox
            title="Vehicle"
            value={
              selectedHistory.vehicle_name
            }
          />

          <HistoryBox
            title="VIN"
            value={
              selectedHistory.vin
            }
          />

          <HistoryBox
            title="Mechanic"
            value={
              selectedHistory.mechanic_name
            }
          />

          <HistoryBox
            title="Issue"
            value={
              selectedHistory.issue_description
            }
          />

          <HistoryBox
            title="Status"
            value={
              selectedHistory.status
            }
          />

        </div>


        <div className="history-detail-grid">

          <div className="history-panel">

            <h3>
              Service Checklist
            </h3>

            {selectedHistory.checklist.length === 0 ? (

              <p className="muted-text">
                No checklist records.
              </p>

            ) : (

              selectedHistory.checklist.map(
                (item) => (

                  <div
                    className="history-item"
                    key={item.id}
                  >

                    <strong>
                      {item.completed
                        ? "✓ "
                        : "○ "}

                      {item.item_name}
                    </strong>

                    <p>
                      {item.notes ||
                        "No notes"}
                    </p>

                  </div>

                )
              )

            )}

          </div>


          <div className="history-panel">

            <h3>
              Parts Used
            </h3>

            <div className="table-wrapper">

              <table className="customer-table">

                <thead>
                  <tr>
                    <th>Part</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>

                <tbody>

                  {selectedHistory.parts.map(
                    (part) => (

                      <tr key={part.id}>
                        <td>
                          {part.part_name}
                        </td>

                        <td>
                          {part.quantity}
                        </td>

                        <td>
                          ₹{part.price}
                        </td>

                        <td>
                          ₹{part.total}
                        </td>
                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

            <div className="parts-total">
              Total Parts Cost:
              {" "}
              ₹{selectedHistory.parts_total.toFixed(2)}
            </div>

          </div>

        </div>

      </ManagementShell>
    );
  }


  // ======================================================
  // SERVICE HISTORY PAGE
  // ======================================================

  if (page === "service-history") {

    const filteredHistory =
      serviceHistory.filter(
        (record) => {

          const text =
            historySearch
              .toLowerCase();

          return (
            record.customer_name
              .toLowerCase()
              .includes(text) ||

            record.vehicle_name
              .toLowerCase()
              .includes(text) ||

            record.vin
              .toLowerCase()
              .includes(text) ||

            record.mechanic_name
              .toLowerCase()
              .includes(text)
          );
        }
      );

    return (
      <ManagementShell
        user={user}
        logout={logout}
        title="Service History"
        description="Completed customer vehicle service records."
        back={() =>
          setPage("dashboard")
        }
        message={message}
      >

        <div className="history-toolbar">

          <input
            placeholder="Search customer, vehicle, VIN or mechanic..."
            value={historySearch}
            onChange={(e) =>
              setHistorySearch(
                e.target.value
              )
            }
          />

          <span>
            {filteredHistory.length}
            {" "}
            Completed Jobs
          </span>

        </div>


        <div className="customer-list-card">

          {filteredHistory.length === 0 ? (

            <div className="empty-state">
              <h4>
                No completed services
              </h4>

              <p>
                Completed work orders will appear here.
              </p>
            </div>

          ) : (

            <div className="table-wrapper">

              <table className="customer-table">

                <thead>

                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Vehicle</th>
                    <th>VIN</th>
                    <th>Mechanic</th>
                    <th>Issue</th>
                    <th>Parts Cost</th>
                    <th>Details</th>
                  </tr>

                </thead>


                <tbody>

                  {filteredHistory.map(
                    (record) => (

                      <tr key={record.id}>

                        <td>
                          {record.id}
                        </td>

                        <td>
                          {record.customer_name}
                        </td>

                        <td>
                          {record.vehicle_name}
                        </td>

                        <td>
                          {record.vin}
                        </td>

                        <td>
                          {record.mechanic_name}
                        </td>

                        <td>
                          {record.issue_description}
                        </td>

                        <td>
                          ₹{record.parts_total.toFixed(2)}
                        </td>

                        <td>

                          <button
                            className="view-button"
                            onClick={() =>
                              openHistoryDetail(
                                record.id
                              )
                            }
                          >
                            View
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </ManagementShell>
    );
  }


  // ======================================================
  // MECHANIC JOB DETAIL
  // ======================================================

  if (
    user.role === "Mechanic" &&
    page === "job-detail" &&
    selectedWorkOrder
  ) {

    const total =
      parts.reduce(
        (sum, part) =>
          sum + part.total,
        0
      );

    return (
      <ManagementShell
        user={user}
        logout={logout}
        title={`Work Order #${selectedWorkOrder.id}`}
        description={`${selectedWorkOrder.vehicle_name} — ${selectedWorkOrder.vin}`}
        back={() =>
          setPage("mechanic-jobs")
        }
        message={message}
      >

        <div className="job-summary-card">

          <HistoryBox
            title="Customer"
            value={
              selectedWorkOrder.customer_name
            }
          />

          <HistoryBox
            title="Vehicle"
            value={
              selectedWorkOrder.vehicle_name
            }
          />

          <HistoryBox
            title="Issue"
            value={
              selectedWorkOrder.issue_description
            }
          />

          <div>

            <strong>Status</strong>

            <select
              className="status-select"
              value={
                selectedWorkOrder.status
              }
              onChange={(e) =>
                updateWorkOrderStatus(
                  selectedWorkOrder.id,
                  e.target.value
                )
              }
            >

              <option>Open</option>
              <option>Assigned</option>
              <option>In Progress</option>
              <option>Waiting for Parts</option>
              <option>Completed</option>
              <option>Cancelled</option>

            </select>

          </div>

        </div>


        <div className="mechanic-grid">

          <div className="mechanic-panel">

            <h3>
              Service Checklist
            </h3>

            <form
              className="inline-form"
              onSubmit={
                addChecklistItem
              }
            >

              <input
                placeholder="Checklist item"
                value={
                  checklistForm.item_name
                }
                onChange={(e) =>
                  setChecklistForm({
                    ...checklistForm,
                    item_name:
                      e.target.value,
                  })
                }
                required
              />

              <textarea
                placeholder="Initial notes"
                value={
                  checklistForm.notes
                }
                onChange={(e) =>
                  setChecklistForm({
                    ...checklistForm,
                    notes:
                      e.target.value,
                  })
                }
              />

              <button
                className="save-button"
              >
                Add Checklist Item
              </button>

            </form>


            {workItems.map((item) => (

              <div
                className="checklist-item"
                key={item.id}
              >

                <label className="check-label">

                  <input
                    type="checkbox"
                    checked={
                      item.completed
                    }
                    onChange={() =>
                      toggleChecklistItem(
                        item
                      )
                    }
                  />

                  <span>
                    {item.item_name}
                  </span>

                </label>

                <textarea
                  className="notes-box"
                  defaultValue={
                    item.notes || ""
                  }
                  onBlur={(e) =>
                    updateChecklistNotes(
                      item,
                      e.target.value
                    )
                  }
                />

              </div>

            ))}

          </div>


          <div className="mechanic-panel">

            <h3>
              Parts Used
            </h3>

            <form
              className="inline-form"
              onSubmit={addPart}
            >

              <input
                placeholder="Part name"
                value={
                  partForm.part_name
                }
                onChange={(e) =>
                  setPartForm({
                    ...partForm,
                    part_name:
                      e.target.value,
                  })
                }
                required
              />

              <input
                type="number"
                min="1"
                value={
                  partForm.quantity
                }
                onChange={(e) =>
                  setPartForm({
                    ...partForm,
                    quantity:
                      e.target.value,
                  })
                }
              />

              <input
                type="number"
                min="0"
                value={
                  partForm.price
                }
                onChange={(e) =>
                  setPartForm({
                    ...partForm,
                    price:
                      e.target.value,
                  })
                }
              />

              <button
                className="save-button"
              >
                Add Part
              </button>

            </form>


            <table className="customer-table">

              <thead>
                <tr>
                  <th>Part</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>

                {parts.map((part) => (

                  <tr key={part.id}>
                    <td>
                      {part.part_name}
                    </td>

                    <td>
                      {part.quantity}
                    </td>

                    <td>
                      ₹{part.price}
                    </td>

                    <td>
                      ₹{part.total}
                    </td>
                  </tr>

                ))}

              </tbody>

            </table>

            <div className="parts-total">
              Parts Total:
              {" "}
              ₹{total.toFixed(2)}
            </div>

          </div>

        </div>

      </ManagementShell>
    );
  }


  // ======================================================
  // MECHANIC JOBS
  // ======================================================

  if (
    user.role === "Mechanic" &&
    page === "mechanic-jobs"
  ) {
    return (
      <ManagementShell
        user={user}
        logout={logout}
        title="Assigned Jobs"
        description="Your assigned service work orders."
        back={() =>
          setPage("dashboard")
        }
        message={message}
      >

        <div className="customer-list-card">

          <div className="list-title-row">
            <h3>
              My Work Orders
            </h3>

            <span>
              {workOrders.length} Jobs
            </span>
          </div>


          <table className="customer-table">

            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Issue</th>
                <th>Status</th>
                <th>Job</th>
              </tr>
            </thead>

            <tbody>

              {workOrders.map(
                (order) => (

                  <tr key={order.id}>

                    <td>{order.id}</td>

                    <td>
                      {order.customer_name}
                    </td>

                    <td>
                      {order.vehicle_name}
                    </td>

                    <td>
                      {order.issue_description}
                    </td>

                    <td>
                      {order.status}
                    </td>

                    <td>

                      <button
                        className="view-button"
                        onClick={async () => {
                          await fetchJobDetails(
                            order.id
                          );

                          setPage(
                            "job-detail"
                          );
                        }}
                      >
                        Open Job
                      </button>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      </ManagementShell>
    );
  }


  // ======================================================
  // CUSTOMERS
  // ======================================================

  if (
    user.role !== "Mechanic" &&
    page === "customers"
  ) {
    return (
      <ManagementShell
        user={user}
        logout={logout}
        title="Customer Management"
        description="Add and manage service center customers."
        back={() =>
          setPage("dashboard")
        }
        message={message}
      >

        <div className="customer-layout">

          <div className="customer-form-card">

            <h3>
              Add New Customer
            </h3>

            <form
              onSubmit={
                saveCustomer
              }
            >

              <label>Name</label>

              <input
                value={
                  customerForm.name
                }
                onChange={(e) =>
                  setCustomerForm({
                    ...customerForm,
                    name:
                      e.target.value,
                  })
                }
                required
              />

              <label>Phone</label>

              <input
                value={
                  customerForm.phone
                }
                onChange={(e) =>
                  setCustomerForm({
                    ...customerForm,
                    phone:
                      e.target.value,
                  })
                }
                required
              />

              <label>Email</label>

              <input
                value={
                  customerForm.email
                }
                onChange={(e) =>
                  setCustomerForm({
                    ...customerForm,
                    email:
                      e.target.value,
                  })
                }
              />

              <label>Address</label>

              <textarea
                value={
                  customerForm.address
                }
                onChange={(e) =>
                  setCustomerForm({
                    ...customerForm,
                    address:
                      e.target.value,
                  })
                }
              />

              <button
                className="save-button"
              >
                Add Customer
              </button>

            </form>

          </div>


          <div className="customer-list-card">

            <h3>Customer List</h3>

            <table className="customer-table">

              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Address</th>
                </tr>
              </thead>

              <tbody>

                {customers.map(
                  (customer) => (

                    <tr key={customer.id}>
                      <td>
                        {customer.name}
                      </td>

                      <td>
                        {customer.phone}
                      </td>

                      <td>
                        {customer.email}
                      </td>

                      <td>
                        {customer.address}
                      </td>
                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      </ManagementShell>
    );
  }


  // ======================================================
  // VEHICLES
  // ======================================================

  if (
    user.role !== "Mechanic" &&
    page === "vehicles"
  ) {
    return (
      <ManagementShell
        user={user}
        logout={logout}
        title="Vehicle Management"
        description="Register vehicles and decode VIN information."
        back={() =>
          setPage("dashboard")
        }
        message={message}
      >

        <div className="customer-layout">

          <div className="customer-form-card">

            <h3>
              Register Vehicle
            </h3>

            <form onSubmit={saveVehicle}>

              <label>Customer</label>

              <select
                value={
                  vehicleForm.customer_id
                }
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    customer_id:
                      e.target.value,
                  })
                }
                required
              >

                <option value="">
                  Select Customer
                </option>

                {customers.map(
                  (customer) => (

                    <option
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.name}
                    </option>

                  )
                )}

              </select>


              <label>VIN</label>

              <div className="vin-row">

                <input
                  maxLength="17"
                  value={
                    vehicleForm.vin
                  }
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      vin:
                        e.target.value,
                    })
                  }
                  required
                />

                <button
                  type="button"
                  className="vin-button"
                  onClick={lookupVIN}
                >
                  {vinLoading
                    ? "Looking..."
                    : "Decode VIN"}
                </button>

              </div>


              <label>Make</label>

              <input
                value={
                  vehicleForm.make
                }
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    make:
                      e.target.value,
                  })
                }
              />

              <label>Model</label>

              <input
                value={
                  vehicleForm.model
                }
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    model:
                      e.target.value,
                  })
                }
              />

              <label>Year</label>

              <input
                value={
                  vehicleForm.year
                }
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    year:
                      e.target.value,
                  })
                }
              />

              <label>
                Vehicle Type
              </label>

              <input
                value={
                  vehicleForm.vehicle_type
                }
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    vehicle_type:
                      e.target.value,
                  })
                }
              />

              <button
                className="save-button"
              >
                Save Vehicle
              </button>

            </form>

          </div>


          <div className="customer-list-card">

            <h3>
              Registered Vehicles
            </h3>

            <table className="customer-table">

              <thead>
                <tr>
                  <th>Customer</th>
                  <th>VIN</th>
                  <th>Make</th>
                  <th>Model</th>
                  <th>Year</th>
                </tr>
              </thead>

              <tbody>

                {vehicles.map(
                  (vehicle) => (

                    <tr key={vehicle.id}>
                      <td>
                        {vehicle.customer_name}
                      </td>

                      <td>
                        {vehicle.vin}
                      </td>

                      <td>
                        {vehicle.make}
                      </td>

                      <td>
                        {vehicle.model}
                      </td>

                      <td>
                        {vehicle.year}
                      </td>
                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      </ManagementShell>
    );
  }


  // ======================================================
  // APPOINTMENTS
  // ======================================================

  if (
    user.role !== "Mechanic" &&
    page === "appointments"
  ) {

    const availableVehicles =
      vehicles.filter(
        (vehicle) =>
          String(
            vehicle.customer_id
          ) ===
          String(
            appointmentForm.customer_id
          )
      );

    return (
      <ManagementShell
        user={user}
        logout={logout}
        title="Service Appointments"
        description="Schedule and manage vehicle service appointments."
        back={() =>
          setPage("dashboard")
        }
        message={message}
      >

        <div className="customer-layout">

          <div className="customer-form-card">

            <h3>
              Create Appointment
            </h3>

            <form
              onSubmit={
                saveAppointment
              }
            >

              <label>Customer</label>

              <select
                value={
                  appointmentForm.customer_id
                }
                onChange={(e) =>
                  setAppointmentForm({
                    ...appointmentForm,

                    customer_id:
                      e.target.value,

                    vehicle_id: "",
                  })
                }
                required
              >

                <option value="">
                  Select Customer
                </option>

                {customers.map(
                  (customer) => (

                    <option
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.name}
                    </option>

                  )
                )}

              </select>


              <label>Vehicle</label>

              <select
                value={
                  appointmentForm.vehicle_id
                }
                onChange={(e) =>
                  setAppointmentForm({
                    ...appointmentForm,

                    vehicle_id:
                      e.target.value,
                  })
                }
                required
              >

                <option value="">
                  Select Vehicle
                </option>

                {availableVehicles.map(
                  (vehicle) => (

                    <option
                      key={vehicle.id}
                      value={vehicle.id}
                    >
                      {vehicle.make}
                      {" "}
                      {vehicle.model}
                    </option>

                  )
                )}

              </select>


              <label>Date</label>

              <input
                type="date"
                value={
                  appointmentForm.appointment_date
                }
                onChange={(e) =>
                  setAppointmentForm({
                    ...appointmentForm,

                    appointment_date:
                      e.target.value,
                  })
                }
                required
              />


              <label>
                Service Type
              </label>

              <select
                value={
                  appointmentForm.service_type
                }
                onChange={(e) =>
                  setAppointmentForm({
                    ...appointmentForm,

                    service_type:
                      e.target.value,
                  })
                }
                required
              >

                <option value="">
                  Select Service
                </option>

                <option>
                  General Service
                </option>

                <option>
                  Oil Change
                </option>

                <option>
                  Brake Inspection
                </option>

                <option>
                  Engine Diagnosis
                </option>

                <option>
                  AC Service
                </option>

              </select>


              <button
                className="save-button"
              >
                Create Appointment
              </button>

            </form>

          </div>


          <div className="customer-list-card">

            <h3>
              Appointment List
            </h3>

            <table className="customer-table">

              <thead>

                <tr>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Date</th>
                  <th>Service</th>
                  <th>Status</th>
                </tr>

              </thead>

              <tbody>

                {appointments.map(
                  (appointment) => (

                    <tr key={appointment.id}>

                      <td>
                        {appointment.customer_name}
                      </td>

                      <td>
                        {appointment.vehicle_name}
                      </td>

                      <td>
                        {appointment.appointment_date}
                      </td>

                      <td>
                        {appointment.service_type}
                      </td>

                      <td>

                        <select
                          className="status-select"
                          value={
                            appointment.status
                          }
                          onChange={(e) =>
                            updateAppointmentStatus(
                              appointment.id,
                              e.target.value
                            )
                          }
                        >

                          <option>
                            Scheduled
                          </option>

                          <option>
                            Confirmed
                          </option>

                          <option>
                            In Service
                          </option>

                          <option>
                            Completed
                          </option>

                          <option>
                            Cancelled
                          </option>

                        </select>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      </ManagementShell>
    );
  }


  // ======================================================
  // WORK ORDERS
  // ======================================================

  if (
    user.role !== "Mechanic" &&
    page === "workorders"
  ) {
    return (
      <ManagementShell
        user={user}
        logout={logout}
        title="Work Orders"
        description="Create jobs, assign mechanics and track service status."
        back={() =>
          setPage("dashboard")
        }
        message={message}
      >

        <div className="customer-layout">

          <div className="customer-form-card">

            <h3>
              Create Work Order
            </h3>

            <form
              onSubmit={
                saveWorkOrder
              }
            >

              <label>Vehicle</label>

              <select
                value={
                  workOrderForm.vehicle_id
                }
                onChange={(e) =>
                  setWorkOrderForm({
                    ...workOrderForm,

                    vehicle_id:
                      e.target.value,
                  })
                }
                required
              >

                <option value="">
                  Select Vehicle
                </option>

                {vehicles.map(
                  (vehicle) => (

                    <option
                      key={vehicle.id}
                      value={vehicle.id}
                    >
                      {vehicle.customer_name}
                      {" — "}
                      {vehicle.make}
                      {" "}
                      {vehicle.model}
                    </option>

                  )
                )}

              </select>


              <label>
                Assign Mechanic
              </label>

              <select
                value={
                  workOrderForm.mechanic_id
                }
                onChange={(e) =>
                  setWorkOrderForm({
                    ...workOrderForm,

                    mechanic_id:
                      e.target.value,
                  })
                }
              >

                <option value="">
                  Unassigned
                </option>

                {mechanics.map(
                  (mechanic) => (

                    <option
                      key={mechanic.id}
                      value={mechanic.id}
                    >
                      {mechanic.name}
                    </option>

                  )
                )}

              </select>


              <label>
                Issue Description
              </label>

              <textarea
                rows="5"
                value={
                  workOrderForm.issue_description
                }
                onChange={(e) =>
                  setWorkOrderForm({
                    ...workOrderForm,

                    issue_description:
                      e.target.value,
                  })
                }
                required
              />


              <button
                className="save-button"
              >
                Create Work Order
              </button>

            </form>

          </div>


          <div className="customer-list-card">

            <h3>
              Work Order List
            </h3>

            <table className="customer-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Mechanic</th>
                  <th>Issue</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {workOrders.map(
                  (order) => (

                    <tr key={order.id}>

                      <td>
                        {order.id}
                      </td>

                      <td>
                        {order.customer_name}
                      </td>

                      <td>
                        {order.vehicle_name}
                      </td>

                      <td>
                        {order.mechanic_name}
                      </td>

                      <td>
                        {order.issue_description}
                      </td>

                      <td>

                        <select
                          className="status-select"
                          value={order.status}
                          onChange={(e) =>
                            updateWorkOrderStatus(
                              order.id,
                              e.target.value
                            )
                          }
                        >

                          <option>Open</option>
                          <option>Assigned</option>
                          <option>In Progress</option>
                          <option>Waiting for Parts</option>
                          <option>Completed</option>
                          <option>Cancelled</option>

                        </select>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      </ManagementShell>
    );
  }


  // ======================================================
  // MECHANIC DASHBOARD
  // ======================================================

  if (user.role === "Mechanic") {
    return (
      <DashboardLayout
        user={user}
        logout={logout}
        title="Mechanic Dashboard"
        subtitle="View assigned jobs, checklist, notes and parts."
      >

        <DashboardCard
          title="Assigned Jobs"
          text="View service jobs assigned to you."
          button="View Jobs"
          onClick={() =>
            setPage(
              "mechanic-jobs"
            )
          }
        />

      </DashboardLayout>
    );
  }


  // ======================================================
  // MANAGER DASHBOARD
  // ======================================================

  if (user.role === "Manager") {
    return (
      <div className="dashboard">

        <TopBar
          user={user}
          logout={logout}
        />

        <div className="dashboard-content">

          <h2>
            Manager Dashboard
          </h2>

          <p className="subtitle">
            Monitor service center operations and completed service history.
          </p>


          {managerSummary && (

            <div className="summary-grid">

              <SummaryCard
                title="Customers"
                value={
                  managerSummary.customers
                }
              />

              <SummaryCard
                title="Vehicles"
                value={
                  managerSummary.vehicles
                }
              />

              <SummaryCard
                title="Appointments"
                value={
                  managerSummary.appointments
                }
              />

              <SummaryCard
                title="Active Jobs"
                value={
                  managerSummary.active_jobs
                }
              />

              <SummaryCard
                title="Completed Jobs"
                value={
                  managerSummary.completed_jobs
                }
              />

              <SummaryCard
                title="Parts Value"
                value={
                  `₹${managerSummary.parts_total}`
                }
              />

            </div>

          )}


          <div className="dashboard-grid manager-actions">

            <DashboardCard
              title="Service History"
              text="View all completed customer vehicle service records."
              button="View History"
              onClick={() =>
                setPage(
                  "service-history"
                )
              }
            />

            <DashboardCard
              title="Work Orders"
              text="Review all service jobs and current repair status."
              button="View Work Orders"
              onClick={() =>
                setPage(
                  "workorders"
                )
              }
            />

            <DashboardCard
              title="Customers"
              text="View customer records."
              button="Customers"
              onClick={() =>
                setPage(
                  "customers"
                )
              }
            />

          </div>

        </div>

      </div>
    );
  }


  // ======================================================
  // ADVISOR DASHBOARD
  // ======================================================

  return (
    <DashboardLayout
      user={user}
      logout={logout}
      title="Advisor Dashboard"
      subtitle="Manage customers, vehicles, appointments and service jobs."
    >

      <DashboardCard
        title="Customers"
        text="Add and manage service center customers."
        button="Manage Customers"
        onClick={() =>
          setPage("customers")
        }
      />

      <DashboardCard
        title="Vehicles"
        text="Register vehicles and decode VIN information."
        button="Manage Vehicles"
        onClick={() =>
          setPage("vehicles")
        }
      />

      <DashboardCard
        title="VIN Lookup"
        text="Decode vehicle information using NHTSA vPIC."
        button="VIN Lookup"
        onClick={() =>
          setPage("vehicles")
        }
      />

      <DashboardCard
        title="Appointments"
        text="Create and manage service appointments."
        button="Appointments"
        onClick={() =>
          setPage(
            "appointments"
          )
        }
      />

      <DashboardCard
        title="Work Orders"
        text="Create jobs and assign service mechanics."
        button="Work Orders"
        onClick={() =>
          setPage(
            "workorders"
          )
        }
      />

      <DashboardCard
        title="Service History"
        text="View completed customer vehicle service records."
        button="View History"
        onClick={() =>
          setPage(
            "service-history"
          )
        }
      />

    </DashboardLayout>
  );
}


function TopBar({
  user,
  logout,
}) {
  return (
    <div className="topbar">

      <div>
        <h1>
          AutoCare Desk
        </h1>

        <p>
          Vehicle Service Center CRM
        </p>
      </div>

      <div className="user-info">
        <h3>
          {user.name}
        </h3>

        <p>
          {user.role}
        </p>

        <button
          onClick={logout}
        >
          Logout
        </button>
      </div>

    </div>
  );
}


function ManagementShell({
  user,
  logout,
  title,
  description,
  back,
  message,
  children,
}) {
  return (
    <div className="dashboard">

      <TopBar
        user={user}
        logout={logout}
      />

      <div className="customer-page">

        <div className="page-header">

          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>

          <button
            className="back-button"
            onClick={back}
          >
            Back
          </button>

        </div>

        {message && (
          <div className="page-message">
            {message}
          </div>
        )}

        {children}

      </div>

    </div>
  );
}


function DashboardLayout({
  user,
  logout,
  title,
  subtitle,
  children,
}) {
  return (
    <div className="dashboard">

      <TopBar
        user={user}
        logout={logout}
      />

      <div className="dashboard-content">

        <h2>{title}</h2>

        <p className="subtitle">
          {subtitle}
        </p>

        <div className="dashboard-grid">
          {children}
        </div>

      </div>

    </div>
  );
}


function DashboardCard({
  title,
  text,
  button,
  onClick,
}) {
  return (
    <div className="dashboard-card">

      <h3>{title}</h3>

      <p>{text}</p>

      <button
        onClick={onClick}
      >
        {button}
      </button>

    </div>
  );
}


function HistoryBox({
  title,
  value,
}) {
  return (
    <div>
      <strong>{title}</strong>
      <span>{value || "-"}</span>
    </div>
  );
}


function SummaryCard({
  title,
  value,
}) {
  return (
    <div className="summary-card">

      <span>
        {title}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}


export default App;