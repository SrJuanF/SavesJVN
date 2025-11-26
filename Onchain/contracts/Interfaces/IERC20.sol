// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IERC20 Interface
/// @notice Interfaz estándar ERC-20 para tokens fungibles.
interface IERC20 {
    /// @notice Devuelto por totalSupply para conocer el suministro total del token.
    function totalSupply() external view returns (uint256);

    /// @notice Devuelve el balance de una cuenta.
    function balanceOf(address account) external view returns (uint256);

    /// @notice Transfiere tokens al destinatario.
    /// @return true si la operación fue exitosa.
    function transfer(address to, uint256 amount) external returns (bool);

    /// @notice Devuelve la cantidad que el `spender` puede gastar en nombre de `owner`.
    function allowance(address owner, address spender) external view returns (uint256);

    /// @notice Aprueba a `spender` para gastar `amount` en nombre del llamador.
    /// @return true si la operación fue exitosa.
    function approve(address spender, uint256 amount) external returns (bool);

    /// @notice Transfiere tokens desde `from` hacia `to` usando la asignación aprobada.
    /// @return true si la operación fue exitosa.
    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    function increaseAllowance(address spender, uint256 addedValue) external returns (bool);

    /// @dev Evento emitido en cada transferencia.
    event Transfer(address indexed from, address indexed to, uint256 value);

    /// @dev Evento emitido cuando se cambia una asignación (allowance).
    event Approval(address indexed owner, address indexed spender, uint256 value);
}