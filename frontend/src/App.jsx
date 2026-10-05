import {
  useEffect,
  useState,
} from "react";

import "./App.css";

const API =
  "https://autocare-desk.onrender.com";


function App() {

  // ======================================================
  // SAVED LOGIN
  // ======================================================

  const storedToken =
    localStorage.getItem(
      "autocare_token"
    ) || "";

  const storedUser =
    localStorage.getItem(
      "autocare_user"
    );

  let parsedUser = null;

  try {

    parsedUser =
      storedUser
        ? JSON.parse(
            storedUser
          )
        : null;

  } catch {

    parsedUser = null;
  }


  // ======================================================
  // LOGIN STATE
  // ======================================================

  const [
    token,
    setToken,
  ] = useState(
    storedToken
  );

  const [
    user,
    setUser,
  ] = useState(
    parsedUser
  );

  const [
    email,
    setEmail,
  ] = useState(
    "advisor@autocare.com"
  );

  const [
    password,
    setPassword,
  ] = useState(
    "123456"
  );

  const [
    page,
    setPage,
  ] = useState(
    "dashboard"
  );

  const [
    message,
    setMessage,
  ] = useState("");


  // ======================================================
  // DATA
  // ======================================================

  const [
    customers,
    setCustomers,
  ] = useState([]);

  const [
    vehicles,
    setVehicles,
  ] = useState([]);

  const [
    appointments,
    setAppointments,
  ] = useState([]);

  const [
    mechanics,
    setMechanics,
  ] = useState([]);

  const [
    workOrders,
    setWorkOrders,
  ] = useState([]);

  const [
    serviceHistory,
    setServiceHistory,
  ] = useState([]);

  const [
    auditLogs,
    setAuditLogs,
  ] = useState([]);

  const [
    managerSummary,
    setManagerSummary,
  ] = useState(null);


  // ======================================================
  // WORK ORDER DETAILS
  // ======================================================

  const [
    selectedWorkOrder,
    setSelectedWorkOrder,
  ] = useState(null);

  const [
    workItems,
    setWorkItems,
  ] = useState([]);

  const [
    parts,
    setParts,
  ] = useState([]);


  // ======================================================
  // SERVICE HISTORY
  // ======================================================

  const [
    selectedHistory,
    setSelectedHistory,
  ] = useState(null);

  const [
    historySearch,
    setHistorySearch,
  ] = useState("");


  // ======================================================
  // AUDIT
  // ======================================================

  const [
    auditSearch,
    setAuditSearch,
  ] = useState("");


  // ======================================================
  // JOB CARD / INVOICE
  // ======================================================

  const [
    jobCard,
    setJobCard,
  ] = useState(null);

  const [
    invoice,
    setInvoice,
  ] = useState(null);

  const [
    serviceCharge,
    setServiceCharge,
  ] = useState(0);


  // ======================================================
  // CUSTOMER FORM
  // ======================================================

  const [
    customerForm,
    setCustomerForm,
  ] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const [
    editingCustomerId,
    setEditingCustomerId,
  ] = useState(null);


  // ======================================================
  // VEHICLE FORM
  // ======================================================

  const [
    vehicleForm,
    setVehicleForm,
  ] = useState({
    customer_id: "",
    vin: "",
    make: "",
    model: "",
    year: "",
    vehicle_type: "",
  });

  const [
    editingVehicleId,
    setEditingVehicleId,
  ] = useState(null);

  const [
    vinLoading,
    setVinLoading,
  ] = useState(false);


  // ======================================================
  // APPOINTMENT FORM
  // ======================================================

  const [
    appointmentForm,
    setAppointmentForm,
  ] = useState({
    customer_id: "",
    vehicle_id: "",
    appointment_date: "",
    service_type: "",
    status: "Scheduled",
  });

  const [
    editingAppointmentId,
    setEditingAppointmentId,
  ] = useState(null);


  // ======================================================
  // WORK ORDER FORM
  // ======================================================

  const [
    workOrderForm,
    setWorkOrderForm,
  ] = useState({
    vehicle_id: "",
    mechanic_id: "",
    issue_description: "",
    status: "Open",
  });

  const [
    editingWorkOrderId,
    setEditingWorkOrderId,
  ] = useState(null);


  // ======================================================
  // CHECKLIST FORM
  // ======================================================

  const [
    checklistForm,
    setChecklistForm,
  ] = useState({
    item_name: "",
    notes: "",
  });


  // ======================================================
  // PART FORM
  // ======================================================

  const [
    partForm,
    setPartForm,
  ] = useState({
    part_name: "",
    quantity: 1,
    price: 0,
  });


  // ======================================================
  // AUTH FETCH
  // ======================================================

  const apiFetch =
    async (
      url,
      options = {}
    ) => {

      const headers = {
        ...(
          options.headers ||
          {}
        ),
      };

      if (token) {

        headers.Authorization =
          `Bearer ${token}`;
      }

      const response =
        await fetch(
          url,
          {
            ...options,
            headers,
          }
        );

      if (
        response.status === 401
        && user
      ) {

        localStorage.removeItem(
          "autocare_token"
        );

        localStorage.removeItem(
          "autocare_user"
        );

        setToken("");

        setUser(null);

        setPage(
          "dashboard"
        );

        setMessage(
          "Session expired. Please login again."
        );
      }

      return response;
    };


  // ======================================================
  // LOGIN
  // ======================================================

  const handleLogin =
    async (e) => {

      e.preventDefault();

      setMessage("");

      try {

        const response =
          await fetch(
            `${API}/login`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  email,
                  password,
                }),
            }
          );

        const data =
          await response.json();

        if (response.ok) {

          setToken(
            data.token
          );

          setUser(
            data.user
          );

          localStorage.setItem(
            "autocare_token",
            data.token
          );

          localStorage.setItem(
            "autocare_user",
            JSON.stringify(
              data.user
            )
          );

          setPage(
            "dashboard"
          );

          setMessage("");

        } else {

          setMessage(
            data.error ||
            "Login failed"
          );
        }

      } catch {

        setMessage(
          "Cannot connect to backend"
        );
      }
    };


  const logout = () => {

    localStorage.removeItem(
      "autocare_token"
    );

    localStorage.removeItem(
      "autocare_user"
    );

    setToken("");

    setUser(null);

    setPage(
      "dashboard"
    );

    setMessage("");

    setSelectedWorkOrder(
      null
    );

    setSelectedHistory(
      null
    );

    setJobCard(
      null
    );
  };


  // ======================================================
  // FETCH CUSTOMERS
  // ======================================================

  const fetchCustomers =
    async () => {

      const response =
        await apiFetch(
          `${API}/customers`
        );

      const data =
        await response.json();

      if (response.ok) {

        setCustomers(
          data
        );

      } else {

        setMessage(
          data.error
        );
      }
    };


  // ======================================================
  // FETCH VEHICLES
  // ======================================================

  const fetchVehicles =
    async () => {

      const response =
        await apiFetch(
          `${API}/vehicles`
        );

      const data =
        await response.json();

      if (response.ok) {

        setVehicles(
          data
        );

      } else {

        setMessage(
          data.error
        );
      }
    };


  // ======================================================
  // FETCH APPOINTMENTS
  // ======================================================

  const fetchAppointments =
    async () => {

      const response =
        await apiFetch(
          `${API}/appointments`
        );

      const data =
        await response.json();

      if (response.ok) {

        setAppointments(
          data
        );

      } else {

        setMessage(
          data.error
        );
      }
    };


  // ======================================================
  // FETCH MECHANICS
  // ======================================================

  const fetchMechanics =
    async () => {

      const response =
        await apiFetch(
          `${API}/mechanics`
        );

      const data =
        await response.json();

      if (response.ok) {

        setMechanics(
          data
        );

      } else {

        setMessage(
          data.error
        );
      }
    };


  // ======================================================
  // FETCH WORK ORDERS
  // ======================================================

  const fetchWorkOrders =
    async () => {

      const response =
        await apiFetch(
          `${API}/work-orders`
        );

      const data =
        await response.json();

      if (response.ok) {

        setWorkOrders(
          data
        );

      } else {

        setMessage(
          data.error
        );
      }
    };


  // ======================================================
  // FETCH SERVICE HISTORY
  // ======================================================

  const fetchServiceHistory =
    async () => {

      const response =
        await apiFetch(
          `${API}/service-history`
        );

      const data =
        await response.json();

      if (response.ok) {

        setServiceHistory(
          data
        );

      } else {

        setMessage(
          data.error
        );
      }
    };


  // ======================================================
  // FETCH MANAGER SUMMARY
  // ======================================================

  const fetchManagerSummary =
    async () => {

      const response =
        await apiFetch(
          `${API}/manager-summary`
        );

      const data =
        await response.json();

      if (response.ok) {

        setManagerSummary(
          data
        );

      } else {

        setMessage(
          data.error
        );
      }
    };


  // ======================================================
  // FETCH AUDIT LOGS
  // ======================================================

  const fetchAuditLogs =
    async () => {

      const response =
        await apiFetch(
          `${API}/audit-logs`
        );

      const data =
        await response.json();

      if (response.ok) {

        setAuditLogs(
          data
        );

      } else {

        setMessage(
          data.error
        );
      }
    };


  // ======================================================
  // CUSTOMER CRUD
  // ======================================================

  const resetCustomer =
    () => {

      setCustomerForm({
        name: "",
        phone: "",
        email: "",
        address: "",
      });

      setEditingCustomerId(
        null
      );
    };


  const saveCustomer =
    async (e) => {

      e.preventDefault();

      const editing =
        editingCustomerId !==
        null;

      const response =
        await apiFetch(
          editing
            ? `${API}/customers/${editingCustomerId}`
            : `${API}/customers`,
          {
            method:
              editing
                ? "PUT"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                customerForm
              ),
          }
        );

      const data =
        await response.json();

      if (response.ok) {

        setMessage(
          editing
            ? "Customer updated successfully"
            : "Customer added successfully"
        );

        resetCustomer();

        fetchCustomers();

      } else {

        setMessage(
          data.error
        );
      }
    };


  const editCustomer =
    (customer) => {

      setEditingCustomerId(
        customer.id
      );

      setCustomerForm({
        name:
          customer.name || "",

        phone:
          customer.phone || "",

        email:
          customer.email || "",

        address:
          customer.address || "",
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };


  const deleteCustomer =
    async (
      customerId
    ) => {

      if (
        !window.confirm(
          "Delete this customer?"
        )
      ) {
        return;
      }

      const response =
        await apiFetch(
          `${API}/customers/${customerId}`,
          {
            method:
              "DELETE",
          }
        );

      const data =
        await response.json();

      if (response.ok) {

        setMessage(
          "Customer deleted successfully"
        );

        fetchCustomers();

      } else {

        setMessage(
          data.error
        );
      }
    };


  // ======================================================
  // VEHICLE CRUD / VIN
  // ======================================================

  const resetVehicle =
    () => {

      setVehicleForm({
        customer_id: "",
        vin: "",
        make: "",
        model: "",
        year: "",
        vehicle_type: "",
      });

      setEditingVehicleId(
        null
      );
    };


  const lookupVIN =
    async () => {

      const vin =
        vehicleForm.vin
          .trim()
          .toUpperCase();

      if (
        vin.length !== 17
      ) {

        setMessage(
          "VIN must contain exactly 17 characters"
        );

        return;
      }

      setVinLoading(
        true
      );

      const response =
        await apiFetch(
          `${API}/vin/${vin}`
        );

      const data =
        await response.json();

      if (response.ok) {

        setVehicleForm({
          ...vehicleForm,

          vin:
            data.vin,

          make:
            data.make || "",

          model:
            data.model || "",

          year:
            data.year || "",

          vehicle_type:
            data.vehicle_type ||
            "",
        });

        setMessage(
          "VIN decoded successfully"
        );

      } else {

        setMessage(
          data.error
        );
      }

      setVinLoading(
        false
      );
    };


  const saveVehicle =
    async (e) => {

      e.preventDefault();

      const editing =
        editingVehicleId !==
        null;

      const response =
        await apiFetch(
          editing
            ? `${API}/vehicles/${editingVehicleId}`
            : `${API}/vehicles`,
          {
            method:
              editing
                ? "PUT"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                vehicleForm
              ),
          }
        );

      const data =
        await response.json();

      if (response.ok) {

        setMessage(
          editing
            ? "Vehicle updated successfully"
            : "Vehicle registered successfully"
        );

        resetVehicle();

        fetchVehicles();

      } else {

        setMessage(
          data.error
        );
      }
    };


  const editVehicle =
    (vehicle) => {

      setEditingVehicleId(
        vehicle.id
      );

      setVehicleForm({
        customer_id:
          String(
            vehicle.customer_id
          ),

        vin:
          vehicle.vin || "",

        make:
          vehicle.make || "",

        model:
          vehicle.model || "",

        year:
          vehicle.year || "",

        vehicle_type:
          vehicle.vehicle_type ||
          "",
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };


  const deleteVehicle =
    async (
      vehicleId
    ) => {

      if (
        !window.confirm(
          "Delete this vehicle?"
        )
      ) {
        return;
      }

      const response =
        await apiFetch(
          `${API}/vehicles/${vehicleId}`,
          {
            method:
              "DELETE",
          }
        );

      const data =
        await response.json();

      if (response.ok) {

        setMessage(
          "Vehicle deleted successfully"
        );

        fetchVehicles();

      } else {

        setMessage(
          data.error
        );
      }
    };


  // ======================================================
  // APPOINTMENT CRUD
  // ======================================================

  const resetAppointment =
    () => {

      setAppointmentForm({
        customer_id: "",
        vehicle_id: "",
        appointment_date: "",
        service_type: "",
        status: "Scheduled",
      });

      setEditingAppointmentId(
        null
      );
    };


  const saveAppointment =
    async (e) => {

      e.preventDefault();

      const editing =
        editingAppointmentId !==
        null;

      const response =
        await apiFetch(
          editing
            ? `${API}/appointments/${editingAppointmentId}`
            : `${API}/appointments`,
          {
            method:
              editing
                ? "PUT"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                appointmentForm
              ),
          }
        );

      const data =
        await response.json();

      if (response.ok) {

        setMessage(
          editing
            ? "Appointment updated successfully"
            : "Appointment created successfully"
        );

        resetAppointment();

        fetchAppointments();

      } else {

        setMessage(
          data.error
        );
      }
    };


  const editAppointment =
    (
      appointment
    ) => {

      setEditingAppointmentId(
        appointment.id
      );

      setAppointmentForm({
        customer_id:
          String(
            appointment.customer_id
          ),

        vehicle_id:
          String(
            appointment.vehicle_id
          ),

        appointment_date:
          appointment.appointment_date,

        service_type:
          appointment.service_type,

        status:
          appointment.status,
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };


  const updateAppointmentStatus =
    async (
      appointmentId,
      status
    ) => {

      const response =
        await apiFetch(
          `${API}/appointments/${appointmentId}/status`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                status,
              }),
          }
        );

      const data =
        await response.json();

      if (response.ok) {

        setMessage(
          "Appointment status updated"
        );

        fetchAppointments();

      } else {

        setMessage(
          data.error
        );
      }
    };


  const deleteAppointment =
    async (
      appointmentId
    ) => {

      if (
        !window.confirm(
          "Delete this appointment?"
        )
      ) {
        return;
      }

      const response =
        await apiFetch(
          `${API}/appointments/${appointmentId}`,
          {
            method:
              "DELETE",
          }
        );

      const data =
        await response.json();

      if (response.ok) {

        setMessage(
          "Appointment deleted successfully"
        );

        fetchAppointments();

      } else {

        setMessage(
          data.error
        );
      }
    };


  // ======================================================
  // WORK ORDER CRUD
  // ======================================================

  const resetWorkOrder =
    () => {

      setWorkOrderForm({
        vehicle_id: "",
        mechanic_id: "",
        issue_description: "",
        status: "Open",
      });

      setEditingWorkOrderId(
        null
      );
    };


  const saveWorkOrder =
    async (e) => {

      e.preventDefault();

      const editing =
        editingWorkOrderId !==
        null;

      const response =
        await apiFetch(
          editing
            ? `${API}/work-orders/${editingWorkOrderId}`
            : `${API}/work-orders`,
          {
            method:
              editing
                ? "PUT"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                workOrderForm
              ),
          }
        );

      const data =
        await response.json();

      if (response.ok) {

        setMessage(
          editing
            ? "Work order updated successfully"
            : "Work order created successfully"
        );

        resetWorkOrder();

        fetchWorkOrders();

      } else {

        setMessage(
          data.error
        );
      }
    };


  const editWorkOrder =
    (order) => {

      setEditingWorkOrderId(
        order.id
      );

      setWorkOrderForm({
        vehicle_id:
          String(
            order.vehicle_id
          ),

        mechanic_id:
          order.mechanic_id
            ? String(
                order.mechanic_id
              )
            : "",

        issue_description:
          order.issue_description,

        status:
          order.status,
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };


  const updateWorkOrderStatus =
    async (
      workOrderId,
      status
    ) => {

      const response =
        await apiFetch(
          `${API}/work-orders/${workOrderId}/status`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                status,
              }),
          }
        );

      const data =
        await response.json();

      if (response.ok) {

        setMessage(
          "Work order status updated"
        );

        fetchWorkOrders();

        if (
          selectedWorkOrder?.id
          === workOrderId
        ) {

          fetchJobDetails(
            workOrderId
          );
        }

      } else {

        setMessage(
          data.error
        );
      }
    };


  const deleteWorkOrder =
    async (
      workOrderId
    ) => {

      if (
        !window.confirm(
          "Delete this work order?"
        )
      ) {
        return;
      }

      const response =
        await apiFetch(
          `${API}/work-orders/${workOrderId}`,
          {
            method:
              "DELETE",
          }
        );

      const data =
        await response.json();

      if (response.ok) {

        setMessage(
          "Work order deleted successfully"
        );

        fetchWorkOrders();

      } else {

        setMessage(
          data.error
        );
      }
    };


  // ======================================================
  // FETCH JOB DETAILS
  // ======================================================

  const fetchJobDetails =
    async (
      workOrderId
    ) => {

      const orderResponse =
        await apiFetch(
          `${API}/work-orders/${workOrderId}`
        );

      const orderData =
        await orderResponse.json();

      if (!orderResponse.ok) {

        setMessage(
          orderData.error
        );

        return false;
      }

      setSelectedWorkOrder(
        orderData
      );


      const itemsResponse =
        await apiFetch(
          `${API}/work-orders/${workOrderId}/items`
        );

      const itemsData =
        await itemsResponse.json();

      if (itemsResponse.ok) {

        setWorkItems(
          itemsData
        );
      }


      const partsResponse =
        await apiFetch(
          `${API}/work-orders/${workOrderId}/parts`
        );

      const partsData =
        await partsResponse.json();

      if (partsResponse.ok) {

        setParts(
          partsData
        );
      }

      return true;
    };


  // ======================================================
  // CHECKLIST
  // ======================================================

  const addChecklistItem =
    async (e) => {

      e.preventDefault();

      if (
        !selectedWorkOrder
      ) {
        return;
      }

      const response =
        await apiFetch(
          `${API}/work-orders/${selectedWorkOrder.id}/items`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
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

        setMessage(
          data.error
        );
      }
    };


  const toggleChecklistItem =
    async (item) => {

      const response =
        await apiFetch(
          `${API}/work-items/${item.id}`,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                item_name:
                  item.item_name,

                notes:
                  item.notes,

                completed:
                  !item.completed,
              }),
          }
        );

      const data =
        await response.json();

      if (response.ok) {

        fetchJobDetails(
          selectedWorkOrder.id
        );

      } else {

        setMessage(
          data.error
        );
      }
    };


  const updateChecklistNotes =
    async (
      item,
      notes
    ) => {

      const response =
        await apiFetch(
          `${API}/work-items/${item.id}`,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                item_name:
                  item.item_name,

                notes,

                completed:
                  item.completed,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        setMessage(
          data.error
        );
      }
    };


  const deleteChecklistItem =
    async (
      itemId
    ) => {

      const response =
        await apiFetch(
          `${API}/work-items/${itemId}`,
          {
            method:
              "DELETE",
          }
        );

      const data =
        await response.json();

      if (response.ok) {

        setMessage(
          "Checklist item deleted"
        );

        fetchJobDetails(
          selectedWorkOrder.id
        );

      } else {

        setMessage(
          data.error
        );
      }
    };


  // ======================================================
  // PARTS
  // ======================================================

  const addPart =
    async (e) => {

      e.preventDefault();

      if (
        !selectedWorkOrder
      ) {
        return;
      }

      const response =
        await apiFetch(
          `${API}/work-orders/${selectedWorkOrder.id}/parts`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
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

        setMessage(
          data.error
        );
      }
    };


  const deletePart =
    async (
      partId
    ) => {

      const response =
        await apiFetch(
          `${API}/parts/${partId}`,
          {
            method:
              "DELETE",
          }
        );

      const data =
        await response.json();

      if (response.ok) {

        setMessage(
          "Part deleted successfully"
        );

        fetchJobDetails(
          selectedWorkOrder.id
        );

      } else {

        setMessage(
          data.error
        );
      }
    };


  // ======================================================
  // HISTORY
  // ======================================================

  const openHistoryDetail =
    async (
      workOrderId
    ) => {

      const response =
        await apiFetch(
          `${API}/service-history/${workOrderId}`
        );

      const data =
        await response.json();

      if (response.ok) {

        setSelectedHistory(
          data
        );

        setPage(
          "history-detail"
        );

      } else {

        setMessage(
          data.error
        );
      }
    };


  // ======================================================
  // JOB CARD
  // ======================================================

  const openJobCard =
    async (
      workOrderId
    ) => {

      setMessage("");

      const response =
        await apiFetch(
          `${API}/work-orders/${workOrderId}/job-card`
        );

      const data =
        await response.json();

      if (response.ok) {

        setJobCard(
          data
        );

        setInvoice(
          data.invoice
        );

        setServiceCharge(
          data.invoice
            .service_charge || 0
        );

        setPage(
          "job-card"
        );

      } else {

        setMessage(
          data.error
        );
      }
    };


  const generateInvoice =
    async () => {

      if (!jobCard) {
        return;
      }

      const response =
        await apiFetch(
          `${API}/work-orders/${jobCard.work_order.id}/invoice`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                service_charge:
                  Number(
                    serviceCharge
                  ),
              }),
          }
        );

      const data =
        await response.json();

      if (response.ok) {

        setInvoice(
          data.invoice
        );

        setMessage(
          "Invoice generated successfully"
        );

      } else {

        setMessage(
          data.error
        );
      }
    };


  const changeInvoiceStatus =
    async (
      status
    ) => {

      if (
        !invoice
        || !invoice.id
      ) {

        setMessage(
          "Generate the invoice first"
        );

        return;
      }

      const response =
        await apiFetch(
          `${API}/invoices/${invoice.id}/status`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                status,
              }),
          }
        );

      const data =
        await response.json();

      if (response.ok) {

        setInvoice(
          data.invoice
        );

        setMessage(
          "Invoice status updated"
        );

      } else {

        setMessage(
          data.error
        );
      }
    };


  // ======================================================
  // LOAD PAGE DATA
  // ======================================================

  useEffect(() => {

    if (
      !user
      || !token
    ) {
      return;
    }


    if (
      page === "customers"
    ) {

      fetchCustomers();
    }


    if (
      page === "vehicles"
    ) {

      fetchCustomers();

      fetchVehicles();
    }


    if (
      page === "appointments"
    ) {

      fetchCustomers();

      fetchVehicles();

      fetchAppointments();
    }


    if (
      page === "workorders"
    ) {

      fetchVehicles();

      fetchMechanics();

      fetchWorkOrders();
    }


    if (
      page === "mechanic-jobs"
    ) {

      fetchWorkOrders();
    }


    if (
      page === "service-history"
    ) {

      fetchServiceHistory();
    }


    if (
      page === "audit-logs"
      && user.role ===
      "Manager"
    ) {

      fetchAuditLogs();
    }


    if (
      page === "dashboard"
      && user.role ===
      "Manager"
    ) {

      fetchManagerSummary();
    }

  }, [
    page,
    user,
    token,
  ]);


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
            onSubmit={
              handleLogin
            }
          >

            <label>
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              required
            />


            <label>
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              required
            />


            <button
              type="submit"
            >
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
  // JOB CARD PAGE
  // ======================================================

  if (
    page === "job-card"
    && jobCard
  ) {

    const cardInvoice =
      invoice ||
      jobCard.invoice;

    return (
      <ManagementShell
        user={user}
        logout={logout}
        title={`Job Card #${jobCard.work_order.id}`}
        description="Printable service job card and invoice."
        back={() => {
          setJobCard(
            null
          );

          setInvoice(
            null
          );

          setPage(
            "workorders"
          );
        }}
        message={message}
      >

        <div className="job-card-print-area">

          <div className="job-card-heading">

            <div>

              <h2>
                AutoCare Desk
              </h2>

              <p>
                Vehicle Service Center CRM
              </p>

            </div>


            <div className="job-card-number">

              <strong>
                JOB CARD
              </strong>

              <span>
                #{jobCard.work_order.id}
              </span>

            </div>

          </div>


          <div className="history-summary">

            <HistoryBox
              title="Customer"
              value={
                jobCard.customer.name
              }
            />

            <HistoryBox
              title="Phone"
              value={
                jobCard.customer.phone
              }
            />

            <HistoryBox
              title="Email"
              value={
                jobCard.customer.email
              }
            />

            <HistoryBox
              title="Vehicle"
              value={
                `${jobCard.vehicle.make || ""} ${jobCard.vehicle.model || ""}`
              }
            />

            <HistoryBox
              title="VIN"
              value={
                jobCard.vehicle.vin
              }
            />

            <HistoryBox
              title="Year"
              value={
                jobCard.vehicle.year
              }
            />

            <HistoryBox
              title="Mechanic"
              value={
                jobCard.mechanic.name
              }
            />

            <HistoryBox
              title="Job Status"
              value={
                jobCard.work_order.status
              }
            />

            <HistoryBox
              title="Created"
              value={
                jobCard.work_order.created_at
              }
            />

          </div>


          <div className="job-card-section">

            <h3>
              Customer Complaint / Issue
            </h3>

            <p>
              {jobCard.work_order.issue_description}
            </p>

          </div>


          <div className="history-detail-grid">

            <div className="history-panel">

              <h3>
                Service Checklist
              </h3>

              {jobCard.checklist.length === 0 ? (

                <p className="muted-text">
                  No checklist records.
                </p>

              ) : (

                jobCard.checklist.map(
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
                      <th>
                        Part
                      </th>

                      <th>
                        Qty
                      </th>

                      <th>
                        Price
                      </th>

                      <th>
                        Total
                      </th>
                    </tr>

                  </thead>

                  <tbody>

                    {jobCard.parts.map(
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

            </div>

          </div>


          <div className="invoice-card">

            <h3>
              Invoice Mock
            </h3>


            <div className="invoice-row">

              <span>
                Parts Total
              </span>

              <strong>
                ₹{Number(
                  cardInvoice.parts_total
                ).toFixed(2)}
              </strong>

            </div>


            <div className="invoice-row no-print">

              <span>
                Service / Labour Charge
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  serviceCharge
                }
                onChange={(e) =>
                  setServiceCharge(
                    e.target.value
                  )
                }
              />

            </div>


            <div className="invoice-row print-only">

              <span>
                Service / Labour Charge
              </span>

              <strong>
                ₹{Number(
                  cardInvoice.service_charge
                  || 0
                ).toFixed(2)}
              </strong>

            </div>


            <div className="invoice-row invoice-total">

              <span>
                Total Amount
              </span>

              <strong>
                ₹{Number(
                  cardInvoice.total_amount
                ).toFixed(2)}
              </strong>

            </div>


            <div className="invoice-row">

              <span>
                Payment Status
              </span>

              <strong>
                {cardInvoice.status}
              </strong>

            </div>


            <div className="invoice-actions no-print">

              <button
                className="save-button"
                onClick={
                  generateInvoice
                }
              >
                Generate / Update Invoice
              </button>


              {cardInvoice.id && (

                <select
                  className="status-select"
                  value={
                    cardInvoice.status
                  }
                  onChange={(e) =>
                    changeInvoiceStatus(
                      e.target.value
                    )
                  }
                >

                  <option>
                    Pending
                  </option>

                  <option>
                    Paid
                  </option>

                  <option>
                    Cancelled
                  </option>

                </select>
              )}


              <button
                className="view-button"
                onClick={() =>
                  window.print()
                }
              >
                Print Job Card
              </button>

            </div>

          </div>


          <div className="job-signatures">

            <div>
              Customer Signature
            </div>

            <div>
              Service Advisor Signature
            </div>

          </div>

        </div>

      </ManagementShell>
    );
  }


  // ======================================================
  // HISTORY DETAIL PAGE
  // ======================================================

  if (
    page === "history-detail"
    && selectedHistory
  ) {

    return (
      <ManagementShell
        user={user}
        logout={logout}
        title={`Service Record #${selectedHistory.id}`}
        description={`${selectedHistory.vehicle_name} — ${selectedHistory.vin}`}
        back={() => {
          setSelectedHistory(
            null
          );

          setPage(
            "service-history"
          );
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

              Total Parts Cost: ₹
              {Number(
                selectedHistory.parts_total
              ).toFixed(2)}

            </div>

          </div>

        </div>

      </ManagementShell>
    );
  }


  // ======================================================
  // SERVICE HISTORY PAGE
  // ======================================================

  if (
    page === "service-history"
  ) {

    const search =
      historySearch
        .toLowerCase();

    const filteredHistory =
      serviceHistory.filter(
        (record) =>

          record.customer_name
            .toLowerCase()
            .includes(
              search
            )

          ||

          record.vehicle_name
            .toLowerCase()
            .includes(
              search
            )

          ||

          record.vin
            .toLowerCase()
            .includes(
              search
            )

          ||

          record.mechanic_name
            .toLowerCase()
            .includes(
              search
            )
      );

    return (
      <ManagementShell
        user={user}
        logout={logout}
        title="Service History"
        description="Completed vehicle service records."
        back={() =>
          setPage(
            "dashboard"
          )
        }
        message={message}
      >

        <div className="history-toolbar">

          <input
            placeholder="Search customer, vehicle, VIN or mechanic..."
            value={
              historySearch
            }
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
                No Completed Services
              </h4>

              <p>
                Completed jobs will appear here.
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
                          ₹{Number(
                            record.parts_total
                          ).toFixed(2)}
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
  // AUDIT LOGS PAGE
  // ======================================================

  if (
    user.role === "Manager"
    && page === "audit-logs"
  ) {

    const search =
      auditSearch
        .toLowerCase();

    const filteredLogs =
      auditLogs.filter(
        (log) =>

          log.user
            .toLowerCase()
            .includes(
              search
            )

          ||

          log.role
            .toLowerCase()
            .includes(
              search
            )

          ||

          log.action
            .toLowerCase()
            .includes(
              search
            )
      );

    return (
      <ManagementShell
        user={user}
        logout={logout}
        title="Audit Logs"
        description="System and user activity history."
        back={() =>
          setPage(
            "dashboard"
          )
        }
        message={message}
      >

        <div className="history-toolbar">

          <input
            placeholder="Search user, role or action..."
            value={
              auditSearch
            }
            onChange={(e) =>
              setAuditSearch(
                e.target.value
              )
            }
          />

          <span>
            {filteredLogs.length}
            {" "}
            Logs
          </span>

        </div>


        <div className="customer-list-card">

          <div className="table-wrapper">

            <table className="customer-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Date & Time</th>
                </tr>
              </thead>

              <tbody>

                {filteredLogs.map(
                  (log) => (

                    <tr key={log.id}>

                      <td>
                        {log.id}
                      </td>

                      <td>
                        {log.user}
                      </td>

                      <td>
                        {log.role}
                      </td>

                      <td>
                        {log.action}
                      </td>

                      <td>
                        {log.timestamp}
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
  // MECHANIC JOB DETAIL PAGE
  // ======================================================

  if (
    user.role === "Mechanic"
    &&
    page === "job-detail"
    &&
    selectedWorkOrder
  ) {

    const partsTotal =
      parts.reduce(
        (
          total,
          part
        ) =>
          total +
          Number(
            part.total
          ),
        0
      );

    return (
      <ManagementShell
        user={user}
        logout={logout}
        title={`Work Order #${selectedWorkOrder.id}`}
        description={`${selectedWorkOrder.vehicle_name} — ${selectedWorkOrder.vin}`}
        back={() => {

          setSelectedWorkOrder(
            null
          );

          setPage(
            "mechanic-jobs"
          );
        }}
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

            <strong>
              Status
            </strong>

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

              <option>
                Open
              </option>

              <option>
                Assigned
              </option>

              <option>
                In Progress
              </option>

              <option>
                Waiting for Parts
              </option>

              <option>
                Completed
              </option>

              <option>
                Cancelled
              </option>

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
                placeholder="Mechanic notes"
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


            <div className="checklist-list">

              {workItems.length === 0 && (

                <p className="muted-text">
                  No checklist items yet.
                </p>
              )}


              {workItems.map(
                (item) => (

                  <div
                    className="checklist-item"
                    key={item.id}
                  >

                    <div className="checklist-top">

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

                        <span
                          className={
                            item.completed
                              ? "completed-text"
                              : ""
                          }
                        >
                          {item.item_name}
                        </span>

                      </label>


                      <button
                        className="small-delete"
                        onClick={() =>
                          deleteChecklistItem(
                            item.id
                          )
                        }
                      >
                        Delete
                      </button>

                    </div>


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
                )
              )}

            </div>

          </div>


          <div className="mechanic-panel">

            <h3>
              Parts Used
            </h3>

            <form
              className="inline-form"
              onSubmit={
                addPart
              }
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
                required
              />


              <input
                type="number"
                min="0"
                step="0.01"
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
                required
              />


              <button
                className="save-button"
              >
                Add Part
              </button>

            </form>


            <div className="table-wrapper">

              <table className="customer-table">

                <thead>
                  <tr>
                    <th>Part</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {parts.map(
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

                        <td>

                          <button
                            className="delete-button"
                            onClick={() =>
                              deletePart(
                                part.id
                              )
                            }
                          >
                            Delete
                          </button>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>


            <div className="parts-total">

              Parts Total: ₹
              {partsTotal.toFixed(
                2
              )}

            </div>

          </div>

        </div>

      </ManagementShell>
    );
  }


  // ======================================================
  // MECHANIC JOB LIST PAGE
  // ======================================================

  if (
    user.role === "Mechanic"
    &&
    page === "mechanic-jobs"
  ) {

    return (
      <ManagementShell
        user={user}
        logout={logout}
        title="Assigned Jobs"
        description="Only work orders assigned to you are displayed."
        back={() =>
          setPage(
            "dashboard"
          )
        }
        message={message}
      >

        <div className="customer-list-card">

          <div className="list-title-row">

            <h3>
              My Work Orders
            </h3>

            <span>
              {workOrders.length}
              {" "}
              Jobs
            </span>

          </div>


          {workOrders.length === 0 ? (

            <div className="empty-state">

              <h4>
                No Assigned Jobs
              </h4>

              <p>
                No work orders are assigned to you.
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
                    <th>Issue</th>
                    <th>Status</th>
                    <th>Action</th>
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

                          <br />

                          <small>
                            {order.vin}
                          </small>

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

                              const okay =
                                await fetchJobDetails(
                                  order.id
                                );

                              if (okay) {

                                setPage(
                                  "job-detail"
                                );
                              }
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
          )}

        </div>

      </ManagementShell>
    );
  }


  // ======================================================
  // CUSTOMER PAGE
  // ======================================================

  if (
    user.role !== "Mechanic"
    &&
    page === "customers"
  ) {

    return (
      <ManagementShell
        user={user}
        logout={logout}
        title="Customer Management"
        description="Add, edit and manage service center customers."
        back={() =>
          setPage(
            "dashboard"
          )
        }
        message={message}
      >

        <div className="customer-layout">

          <div className="customer-form-card">

            <h3>

              {editingCustomerId
                ? "Edit Customer"
                : "Add New Customer"}

            </h3>

            <form
              onSubmit={
                saveCustomer
              }
            >

              <label>
                Name
              </label>

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


              <label>
                Phone
              </label>

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


              <label>
                Email
              </label>

              <input
                type="email"
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


              <label>
                Address
              </label>

              <textarea
                rows="4"
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

                {editingCustomerId
                  ? "Update Customer"
                  : "Add Customer"}

              </button>


              {editingCustomerId && (

                <button
                  type="button"
                  className="cancel-button"
                  onClick={
                    resetCustomer
                  }
                >
                  Cancel
                </button>
              )}

            </form>

          </div>


          <div className="customer-list-card">

            <div className="list-title-row">

              <h3>
                Customer List
              </h3>

              <span>
                {customers.length}
                {" "}
                Customers
              </span>

            </div>


            <div className="table-wrapper">

              <table className="customer-table">

                <thead>

                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Address</th>
                    <th>Actions</th>
                  </tr>

                </thead>

                <tbody>

                  {customers.map(
                    (customer) => (

                      <tr key={customer.id}>

                        <td>
                          {customer.id}
                        </td>

                        <td>
                          {customer.name}
                        </td>

                        <td>
                          {customer.phone}
                        </td>

                        <td>
                          {customer.email || "-"}
                        </td>

                        <td>
                          {customer.address || "-"}
                        </td>

                        <td>

                          <div className="action-buttons">

                            <button
                              className="edit-button"
                              onClick={() =>
                                editCustomer(
                                  customer
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="delete-button"
                              onClick={() =>
                                deleteCustomer(
                                  customer.id
                                )
                              }
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>

        </div>

      </ManagementShell>
    );
  }


  // ======================================================
  // VEHICLE PAGE
  // ======================================================

  if (
    user.role !== "Mechanic"
    &&
    page === "vehicles"
  ) {

    return (
      <ManagementShell
        user={user}
        logout={logout}
        title="Vehicle Management"
        description="Register vehicles and decode VIN information."
        back={() =>
          setPage(
            "dashboard"
          )
        }
        message={message}
      >

        <div className="customer-layout">

          <div className="customer-form-card">

            <h3>

              {editingVehicleId
                ? "Edit Vehicle"
                : "Register Vehicle"}

            </h3>

            <form
              onSubmit={
                saveVehicle
              }
            >

              <label>
                Customer
              </label>

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


              <label>
                VIN
              </label>

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
                  onClick={
                    lookupVIN
                  }
                >

                  {vinLoading
                    ? "Looking..."
                    : "Decode VIN"}

                </button>

              </div>


              <label>
                Make
              </label>

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


              <label>
                Model
              </label>

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


              <label>
                Year
              </label>

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

                {editingVehicleId
                  ? "Update Vehicle"
                  : "Save Vehicle"}

              </button>


              {editingVehicleId && (

                <button
                  type="button"
                  className="cancel-button"
                  onClick={
                    resetVehicle
                  }
                >
                  Cancel
                </button>
              )}

            </form>

          </div>


          <div className="customer-list-card">

            <div className="list-title-row">

              <h3>
                Registered Vehicles
              </h3>

              <span>
                {vehicles.length}
                {" "}
                Vehicles
              </span>

            </div>


            <div className="table-wrapper">

              <table className="customer-table">

                <thead>

                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>VIN</th>
                    <th>Make</th>
                    <th>Model</th>
                    <th>Year</th>
                    <th>Type</th>
                    <th>Actions</th>
                  </tr>

                </thead>

                <tbody>

                  {vehicles.map(
                    (vehicle) => (

                      <tr key={vehicle.id}>

                        <td>
                          {vehicle.id}
                        </td>

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

                        <td>
                          {vehicle.vehicle_type}
                        </td>

                        <td>

                          <div className="action-buttons">

                            <button
                              className="edit-button"
                              onClick={() =>
                                editVehicle(
                                  vehicle
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="delete-button"
                              onClick={() =>
                                deleteVehicle(
                                  vehicle.id
                                )
                              }
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>

        </div>

      </ManagementShell>
    );
  }


  // ======================================================
  // APPOINTMENTS PAGE
  // ======================================================

  if (
    user.role !== "Mechanic"
    &&
    page === "appointments"
  ) {

    const customerVehicles =
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
          setPage(
            "dashboard"
          )
        }
        message={message}
      >

        <div className="customer-layout">

          <div className="customer-form-card">

            <h3>

              {editingAppointmentId
                ? "Edit Appointment"
                : "Create Appointment"}

            </h3>

            <form
              onSubmit={
                saveAppointment
              }
            >

              <label>
                Customer
              </label>

              <select
                value={
                  appointmentForm.customer_id
                }
                onChange={(e) =>
                  setAppointmentForm({
                    ...appointmentForm,

                    customer_id:
                      e.target.value,

                    vehicle_id:
                      "",
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


              <label>
                Vehicle
              </label>

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

                {customerVehicles.map(
                  (vehicle) => (

                    <option
                      key={vehicle.id}
                      value={vehicle.id}
                    >

                      {vehicle.make}
                      {" "}
                      {vehicle.model}
                      {" — "}
                      {vehicle.vin}

                    </option>
                  )
                )}

              </select>


              <label>
                Appointment Date
              </label>

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
                  Tyre Service
                </option>

                <option>
                  Battery Check
                </option>

                <option>
                  AC Service
                </option>

              </select>


              {editingAppointmentId && (

                <>
                  <label>
                    Status
                  </label>

                  <select
                    value={
                      appointmentForm.status
                    }
                    onChange={(e) =>
                      setAppointmentForm({
                        ...appointmentForm,

                        status:
                          e.target.value,
                      })
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
                </>
              )}


              <button
                className="save-button"
              >

                {editingAppointmentId
                  ? "Update Appointment"
                  : "Create Appointment"}

              </button>


              {editingAppointmentId && (

                <button
                  type="button"
                  className="cancel-button"
                  onClick={
                    resetAppointment
                  }
                >
                  Cancel
                </button>
              )}

            </form>

          </div>


          <div className="customer-list-card">

            <div className="list-title-row">

              <h3>
                Appointment List
              </h3>

              <span>
                {appointments.length}
                {" "}
                Appointments
              </span>

            </div>


            <div className="table-wrapper">

              <table className="customer-table">

                <thead>

                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Vehicle</th>
                    <th>Date</th>
                    <th>Service</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>

                </thead>

                <tbody>

                  {appointments.map(
                    (appointment) => (

                      <tr key={appointment.id}>

                        <td>
                          {appointment.id}
                        </td>

                        <td>
                          {appointment.customer_name}
                        </td>

                        <td>

                          {appointment.vehicle_name}

                          <br />

                          <small>
                            {appointment.vin}
                          </small>

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

                        <td>

                          <div className="action-buttons">

                            <button
                              className="edit-button"
                              onClick={() =>
                                editAppointment(
                                  appointment
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="delete-button"
                              onClick={() =>
                                deleteAppointment(
                                  appointment.id
                                )
                              }
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>

        </div>

      </ManagementShell>
    );
  }


  // ======================================================
  // WORK ORDERS PAGE
  // ======================================================

  if (
    user.role !== "Mechanic"
    &&
    page === "workorders"
  ) {

    return (
      <ManagementShell
        user={user}
        logout={logout}
        title="Work Orders"
        description="Create jobs, assign mechanics and track repair status."
        back={() =>
          setPage(
            "dashboard"
          )
        }
        message={message}
      >

        <div className="customer-layout">

          <div className="customer-form-card">

            <h3>

              {editingWorkOrderId
                ? "Edit Work Order"
                : "Create Work Order"}

            </h3>

            <form
              onSubmit={
                saveWorkOrder
              }
            >

              <label>
                Vehicle
              </label>

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


              {editingWorkOrderId && (

                <>
                  <label>
                    Status
                  </label>

                  <select
                    value={
                      workOrderForm.status
                    }
                    onChange={(e) =>
                      setWorkOrderForm({
                        ...workOrderForm,

                        status:
                          e.target.value,
                      })
                    }
                  >

                    <option>
                      Open
                    </option>

                    <option>
                      Assigned
                    </option>

                    <option>
                      In Progress
                    </option>

                    <option>
                      Waiting for Parts
                    </option>

                    <option>
                      Completed
                    </option>

                    <option>
                      Cancelled
                    </option>

                  </select>
                </>
              )}


              <button
                className="save-button"
              >

                {editingWorkOrderId
                  ? "Update Work Order"
                  : "Create Work Order"}

              </button>


              {editingWorkOrderId && (

                <button
                  type="button"
                  className="cancel-button"
                  onClick={
                    resetWorkOrder
                  }
                >
                  Cancel
                </button>
              )}

            </form>

          </div>


          <div className="customer-list-card">

            <div className="list-title-row">

              <h3>
                Work Order List
              </h3>

              <span>
                {workOrders.length}
                {" "}
                Jobs
              </span>

            </div>


            <div className="table-wrapper">

              <table className="customer-table">

                <thead>

                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Vehicle</th>
                    <th>Mechanic</th>
                    <th>Issue</th>
                    <th>Status</th>
                    <th>Actions</th>
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

                          <br />

                          <small>
                            {order.vin}
                          </small>

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
                            value={
                              order.status
                            }
                            onChange={(e) =>
                              updateWorkOrderStatus(
                                order.id,
                                e.target.value
                              )
                            }
                          >

                            <option>
                              Open
                            </option>

                            <option>
                              Assigned
                            </option>

                            <option>
                              In Progress
                            </option>

                            <option>
                              Waiting for Parts
                            </option>

                            <option>
                              Completed
                            </option>

                            <option>
                              Cancelled
                            </option>

                          </select>

                        </td>

                        <td>

                          <div className="action-buttons">

                            <button
                              className="edit-button"
                              onClick={() =>
                                editWorkOrder(
                                  order
                                )
                              }
                            >
                              Edit
                            </button>


                            <button
                              className="view-button"
                              onClick={() =>
                                openJobCard(
                                  order.id
                                )
                              }
                            >
                              Job Card
                            </button>


                            <button
                              className="delete-button"
                              onClick={() =>
                                deleteWorkOrder(
                                  order.id
                                )
                              }
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>

        </div>

      </ManagementShell>
    );
  }


  // ======================================================
  // MECHANIC DASHBOARD
  // ======================================================

  if (
    user.role === "Mechanic"
  ) {

    return (
      <DashboardLayout
        user={user}
        logout={logout}
        title="Mechanic Dashboard"
        subtitle="View assigned jobs, checklist, notes, parts and service status."
      >

        <DashboardCard
          title="Assigned Jobs"
          text="View service jobs assigned to your mechanic account."
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

  if (
    user.role === "Manager"
  ) {

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
            Monitor AutoCare Desk operations and completed service jobs.
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


          <div className="dashboard-grid">

            <DashboardCard
              title="Customers"
              text="View and manage customer records."
              button="Customers"
              onClick={() =>
                setPage(
                  "customers"
                )
              }
            />

            <DashboardCard
              title="Vehicles"
              text="Review customer vehicle records."
              button="Vehicles"
              onClick={() =>
                setPage(
                  "vehicles"
                )
              }
            />

            <DashboardCard
              title="Appointments"
              text="Review service appointments."
              button="Appointments"
              onClick={() =>
                setPage(
                  "appointments"
                )
              }
            />

            <DashboardCard
              title="Work Orders"
              text="Review jobs, mechanics and printable job cards."
              button="Work Orders"
              onClick={() =>
                setPage(
                  "workorders"
                )
              }
            />

            <DashboardCard
              title="Service History"
              text="View completed customer service records."
              button="View History"
              onClick={() =>
                setPage(
                  "service-history"
                )
              }
            />

            <DashboardCard
              title="Audit Logs"
              text="View user and application activity."
              button="View Audit Logs"
              onClick={() =>
                setPage(
                  "audit-logs"
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
          setPage(
            "customers"
          )
        }
      />

      <DashboardCard
        title="Vehicles"
        text="Register customer vehicles and manage VIN information."
        button="Manage Vehicles"
        onClick={() =>
          setPage(
            "vehicles"
          )
        }
      />

      <DashboardCard
        title="VIN Lookup"
        text="Decode vehicle details using the NHTSA vPIC API."
        button="VIN Lookup"
        onClick={() =>
          setPage(
            "vehicles"
          )
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
        text="Create jobs, assign mechanics and generate job cards."
        button="Work Orders"
        onClick={() =>
          setPage(
            "workorders"
          )
        }
      />

      <DashboardCard
        title="Service History"
        text="View completed vehicle service records."
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


// =========================================================
// TOP BAR
// =========================================================

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
          onClick={
            logout
          }
        >
          Logout
        </button>

      </div>

    </div>
  );
}


// =========================================================
// PAGE SHELL
// =========================================================

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

            <h2>
              {title}
            </h2>

            <p>
              {description}
            </p>

          </div>


          <button
            className="back-button"
            onClick={
              back
            }
          >
            Back to Dashboard
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


// =========================================================
// DASHBOARD LAYOUT
// =========================================================

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

        <h2>
          {title}
        </h2>

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


// =========================================================
// DASHBOARD CARD
// =========================================================

function DashboardCard({
  title,
  text,
  button,
  onClick,
}) {

  return (
    <div className="dashboard-card">

      <h3>
        {title}
      </h3>

      <p>
        {text}
      </p>

      <button
        onClick={
          onClick
        }
      >
        {button}
      </button>

    </div>
  );
}


// =========================================================
// HISTORY BOX
// =========================================================

function HistoryBox({
  title,
  value,
}) {

  return (
    <div>

      <strong>
        {title}
      </strong>

      <span>
        {value || "-"}
      </span>

    </div>
  );
}


// =========================================================
// SUMMARY CARD
// =========================================================

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