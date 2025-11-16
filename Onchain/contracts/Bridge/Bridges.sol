// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../Interfaces/IERC20.sol";
import "../Interfaces/IDispatcher.sol";
import "../Interfaces/StateMachine.sol";
import "../Interfaces/IIsmpModule.sol";

contract Bridges is BaseIsmpModule{
    event PostReceived();
    event PostResponseReceived();
    event GetResponseReceived();

    address private immutable _host;

    constructor(address ismpHost) {
        _host = ismpHost;
        // approve the host infintely
        address feeToken = IDispatcher(_host).feeToken();
        IERC20(feeToken).approve(_host, type(uint256).max);
    }

    function host() public view override returns (address) {
        return _host;
    }

    function send_message(
        bytes memory message,
        uint64 timeout,
        address to,
        uint256 relayerFee
    ) public payable returns (bytes32) {
        DispatchPost memory post = DispatchPost({
            body: message,
            dest: StateMachine.polkadot(2000),
            timeout: timeout,
            to: abi.encodePacked(to),
            fee: relayerFee,
            payer: tx.origin
        });
        // Payment with native
        //return IDispatcher(host()).dispatch{value: msg.value}(post);
        return IDispatcher(host()).dispatch(post);
    }

    function sendResponse(
        PostRequest memory request,
        bytes memory response,
        uint64 timeout,
        uint256 relayerFee
    ) public payable returns (bytes32) {
        DispatchPostResponse memory postResponse = DispatchPostResponse({
            request: request,
            response: response,
            timeout: timeout,
            fee: relayerFee,
            payer: msg.sender
        });
        // Payment with native
        //return IDispatcher(host()).dispatch{value: msg.value}(postResponse);
        return IDispatcher(host()).dispatch(postResponse);
    }

    function readState(
        bytes memory dest,
        bytes[] memory keys,
        uint64 timeout,
        uint256 fee,
        uint64 height,
        bytes memory context
    ) public payable returns (bytes32) {
        DispatchGet memory getRequest = DispatchGet({
            dest: dest,
            height: height,
            keys: keys,
            timeout: timeout,
            fee: fee,
            context: context
        });

        return IDispatcher(host()).dispatch(getRequest);
    }

    function onAccept(IncomingPostRequest memory incoming)
        external
        override
        onlyHost
    {
        //Decodificar
        emit PostReceived();
    }

    function onPostResponse(IncomingPostResponse memory) external override onlyHost {
		emit PostResponseReceived();
	}

    function onGetResponse(IncomingGetResponse memory) external override onlyHost {
		emit GetResponseReceived();
	}
}
