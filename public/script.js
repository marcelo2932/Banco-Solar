/*FORMATO NUMERICO A MONEDA CHILENA*/

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
};

/*LISTA DE USUARIOS Y BOTON EDITAR - ELIMINAR */
const getUsuarios = async () => {
    const response = await fetch("http://localhost:3000/usuarios");
    const data = await response.json();
    $(".usuarios").html("");
    $("#emisor").html('<option value="">Selecciona Emisor</option>');
    $("#receptor").html('<option value="">Selecciona Receptor</option>');
    data.forEach((usuario) => {
        $(".usuarios").append(`
            <tr>
                <td>${usuario.nombre}</td>
                <td>${formatCurrency(usuario.balance)}</td>
                <td>
                    <button class="btn btn-warning mr-2" data-toggle="modal" data-target="#exampleModal" onclick="setInfoModal('${usuario.nombre}', '${usuario.balance}', '${usuario.id}')">Editar</button>
                    <button class="btn btn-danger" onclick="eliminarUsuario('${usuario.id}')">Eliminar</button>
                </td>
            </tr>
        `);
        $("#emisor").append(`<option value="${usuario.id}">${usuario.nombre}</option>`);
        $("#receptor").append(`<option value="${usuario.id}">${usuario.nombre}</option>`);
    });
};

/*TABLA DE TRANSFERENCIAS*/
const getTransferencias = async () => {
    const response = await fetch("http://localhost:3000/transferencias");
    const data = await response.json();
    $(".transferencias").html("");
    data.forEach((transferencia) => {
        $(".transferencias").append(`
            <tr>
                <td>${moment(transferencia.fecha).format("DD/MM/YYYY HH:mm")}</td>
                <td>${transferencia.emisor}</td>
                <td>${transferencia.receptor}</td>
                <td>${formatCurrency(transferencia.monto)}</td>
            </tr>
        `);
    });
};

/*MODAL EDITAR USUARIO*/
const setInfoModal = (nombre, balance, id) => {
    $("#nombreEdit").val(nombre);
    $("#balanceEdit").val(balance);
    $("#editButton").attr("onclick", `editUsuario('${id}')`);
};

/*EDITAR USUARIO*/
const editUsuario = async (id) => {
    const nombre = $("#nombreEdit").val();
    const balance = $("#balanceEdit").val();
    try {
        const response = await axios.put(`http://localhost:3000/usuario`, {
            id,
            nombre,
            balance
        });
        if (response.status === 200) {
            $("#exampleModal").modal("hide");
            getUsuarios();
        } else {
            alert("Error al actualizar usuario");
        }
    } catch (e) {
        alert("Algo salió mal: " + e.message);
    }
};

/*ELIMINAR USUARIO*/
const eliminarUsuario = async (id) => {
    if (confirm("¿Estás seguro que deseas eliminar al usuario?")) {
        try {
            const response = await fetch(`http://localhost:3000/usuario?id=${id}`, {
                method: "DELETE",
            });
            if (response.status === 204) {
                getUsuarios();
            } else {
                alert("Error al eliminar usuario");
            }
        } catch (e) {
            alert("Algo salió mal: " + e.message);
        }
    }
};


/*FORMULARIO PARA AGREGAR USUARIO*/
$("#formAgregarUsuario").submit(async (e) => {
    e.preventDefault();
    const nombre = $("#nombre").val();
    const balance = $("#balance").val();
    try {
        const response = await fetch("http://localhost:3000/usuario", {
            method: "post",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                nombre,
                balance,
            }),
        });
        if (response.status === 201) {
            $("#nombre").val("");
            $("#balance").val("");
            getUsuarios();
        } else {
            const result = await response.json();
            throw new Error(result.error || "Error al agregar usuario");
        }
    } catch (e) {
        alert("Algo salió mal: " + e.message);
    }
});
/*FORMULARIO DE TRANSFERENCIA ENTRE USUARIOS*/
$("#formTransferencia").submit(async (e) => {
    e.preventDefault();
    const emisor = $("#emisor").val();
    const receptor = $("#receptor").val();
    const monto = $("#monto").val();
    if (!monto || !emisor || !receptor) {
        alert("Debe seleccionar un emisor, receptor y monto a transferir");
        return false;
    }
    try {
        const response = await fetch("http://localhost:3000/transferencia", {
            method: "post",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                emisor,
                receptor,
                monto,
            }),
        });
        const result = await response.json();
        if (response.status !== 201) {
            throw new Error(result.error);
        }
        location.reload();
    } catch (e) {
        alert(e.message);
    }
});

getUsuarios();
getTransferencias();



